import streamlit as st
import pandas as pd
import gspread
from oauth2client.service_account import ServiceAccountCredentials
from datetime import datetime
import plotly.express as px

# --- הגדרות דף ---
st.set_page_config(page_title="היומן של מייפל", page_icon="🐕", layout="wide")

# CSS RTL
st.markdown("""
    <style>
    @import url('https://fonts.googleapis.com/css2?family=Rubik:wght@400;700&display=swap');
    html, body, [data-testid="stAppViewContainer"], [data-testid="stHeader"] {
        direction: RTL;
        text-align: right;
        font-family: 'Rubik', sans-serif;
    }
    [data-baseweb="tab-list"] { direction: RTL; display: flex; justify-content: flex-end; }
    input, textarea, .stSelectbox, .stNumberInput { direction: RTL; text-align: right; }
    </style>
    """, unsafe_allow_html=True)

# --- חיבור לגוגל שיטס (השיטה הישנה והטובה) ---
SHEET_URL = "https://docs.google.com/spreadsheets/d/1URUI3gpIa2wx_gQdEawCDRp8Tw4h20gun2zeegC-Oz8"

@st.cache_resource
def get_client():
    scope = ['https://spreadsheets.google.com/feeds', 'https://www.googleapis.com/auth/drive']
    # קריאת הקרדנשיאלס מה-Secrets במבנה הישן
    creds_dict = dict(st.secrets["gcp_service_account"])
    creds = ServiceAccountCredentials.from_json_keyfile_dict(creds_dict, scope)
    return gspread.authorize(creds)

def get_worksheet(worksheet_name):
    client = get_client()
    sh = client.open_by_url(SHEET_URL)
    return sh.worksheet(worksheet_name)

def get_data(worksheet_name):
    try:
        sheet = get_worksheet(worksheet_name)
        data = sheet.get_all_records()
        return pd.DataFrame(data)
    except Exception as e:
        # st.error(f"שגיאה בטעינה: {e}")
        return pd.DataFrame()

def append_row(worksheet_name, row_list):
    try:
        sheet = get_worksheet(worksheet_name)
        sheet.append_row(row_list)
        st.cache_data.clear()
        return True
    except Exception as e:
        st.error(f"שגיאה בשמירה: {e}")
        return False

# --- האפליקציה ---
st.title("🐕 המעקב של מייפל")

tab1, tab2, tab3 = st.tabs(["🏃 אימונים וחשיפה", "🦴 האכלות", "🎓 שיעורי בית"])

# --- טאב 1: אימונים (Training) ---
with tab1:
    st.header("תיעוד חשיפה ונטישות")
    with st.expander("📝 הוסף תרגול", expanded=False):
        c1, c2 = st.columns(2)
        with c1:
            d_date = st.date_input("תאריך", datetime.now(), key="d_d")
            d_dur = st.number_input("זמן (דקות)", min_value=1, key="d_dur")
        with c2:
            d_stress = st.slider("לחץ (1-5)", 1, 5, 1, key="d_s")
            d_note = st.text_area("הערות", key="d_n")
            
        if st.button("שמור תרגול"):
            # שים לב: סדר הנתונים חייב לתאום את העמודות בשיטס!
            # Date, Duration, StressLevel, Notes
            row = [str(d_date), d_dur, d_stress, d_note]
            if append_row("Training", row):
                st.success("נשמר!")
                st.rerun()

    st.divider()
    df_train = get_data("Training")
    if not df_train.empty:
        df_train['Date'] = pd.to_datetime(df_train['Date'], errors='coerce')
        df_train = df_train.sort_values('Date')
        st.caption("התקדמות:")
        fig = px.line(df_train, x='Date', y='Duration', markers=True)
        fig.update_traces(line_color='#FFA500')
        st.plotly_chart(fig, use_container_width=True)
    else:
        st.info("אין נתונים ב-Training")

# --- טאב 2: האכלות (Feeding) ---
with tab2:
    st.header("יומן אכילה")
    with st.expander("🍖 הוסף ארוחה"):
        c1, c2 = st.columns(2)
        with c1:
            f_date = st.date_input("תאריך", datetime.now(), key="f_d")
            f_time = st.time_input("שעה", datetime.now().time(), key="f_t")
            f_type = st.selectbox("סוג", ["בוקר", "ערב", "אחר"], key="f_ty")
        with c2:
            f_am = st.number_input("כמות (גרם)", value=100, step=10, key="f_a")
            f_fin = st.checkbox("סיימה?", True, key="f_f")
            f_note = st.text_input("הערות", key="f_n")
            
        if st.button("שמור ארוחה"):
            # Date, Time, Type, Amount, Finished, Notes
            fin_str = "כן" if f_fin else "לא"
            row = [str(f_date), str(f_time), f_type, f_am, fin_str, f_note]
            if append_row("Feeding", row):
                st.success("נשמר!")
                st.rerun()

    st.divider()
    df_food = get_data("Feeding")
    if not df_food.empty:
        df_food['Date'] = pd.to_datetime(df_food['Date'], errors='coerce')
        # וידוא שזה מספר
        df_food['Amount'] = pd.to_numeric(df_food['Amount'], errors='coerce').fillna(0)
        daily = df_food.groupby('Date')['Amount'].sum().reset_index()
        st.caption("כמות יומית:")
        st.plotly_chart(px.bar(daily, x='Date', y='Amount', color_discrete_sequence=['#4CAF50']), use_container_width=True)

# --- טאב 3: משימות (Tasks) ---
with tab3:
    st.header("ניהול משימות")
    
    with st.expander("➕ תרגיל חדש"):
        t_name = st.text_input("שם")
        t_freq = st.text_input("תדירות")
        t_desc = st.text_input("דגשים")
        if st.button("צור תרגיל"):
            if append_row("Tasks", [t_name, t_freq, t_desc, "Active"]):
                st.success("נוצר!")
                st.rerun()

    st.divider()
    df_tasks = get_data("Tasks")
    active = []
    if not df_tasks.empty:
        active = df_tasks[df_tasks['Status'] == 'Active']['TaskName'].tolist()
    
    if active:
        sel_task = st.selectbox("בחר תרגיל", active)
        c1, c2 = st.columns(2)
        with c1: l_date = st.date_input("תאריך", datetime.now(), key="l_d")
        with c2: 
            l_score = st.slider("ציון", 1, 5, 3, key="l_s")
            l_note = st.text_input("הערות", key="l_n")
            
        if st.button("תיעוד ביצוע"):
            # Date, TaskName, Success, Notes
            if append_row("TaskLogs", [str(l_date), sel_task, l_score, l_note]):
                st.success("תועד!")
                st.rerun()
