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

# --- חיבור לגוגל שיטס ---
# הקישור לקובץ שלך
SHEET_URL = "https://docs.google.com/spreadsheets/d/1URUI3gpIa2wx_gQdEawCDRp8Tw4h20gun2zeegC-Oz8"

@st.cache_resource
def get_client():
    scope = ['https://spreadsheets.google.com/feeds', 'https://www.googleapis.com/auth/drive']
    creds_dict = dict(st.secrets["gcp_service_account"])
    creds = ServiceAccountCredentials.from_json_keyfile_dict(creds_dict, scope)
    return gspread.authorize(creds)

def get_worksheet(worksheet_name):
    client = get_client()
    sh = client.open_by_url(SHEET_URL)
    return sh.worksheet(worksheet_name)

def get_data(worksheet_name):
    """
    פונקציה משופרת שקוראת הכל כטקסט גולמי ואז ממירה ל-DataFrame.
    זה מונע קריסות אם יש תאים עם פורמט מוזר.
    """
    try:
        sheet = get_worksheet(worksheet_name)
        # קריאת כל הערכים כולל הכל (רשימה של רשימות)
        all_values = sheet.get_all_values()
        
        if not all_values:
            return pd.DataFrame()

        # השורה הראשונה היא הכותרות
        headers = all_values[0]
        # שאר השורות הן המידע
        data = all_values[1:]

        # יצירת DataFrame
        df = pd.DataFrame(data, columns=headers)
        return df
        
    except Exception as e:
        # כאן אנחנו נראה בדיוק מה הבעיה אם יש כזו
        st.error(f"שגיאה בקריאת הנתונים מ-{worksheet_name}: {e}")
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
            row = [str(d_date), d_dur, d_stress, d_note]
            if append_row("Training", row):
                st.success("נשמר!")
                st.rerun()

    st.divider()
    
    # טעינת הנתונים
    df_train = get_data("Training")
    
    # --- דיבאג ---
    # כאן נראה בדיוק מה המחשב רואה
    with st.expander("🔍 בדיקת נתונים (Debug)", expanded=True):
        if df_train.empty:
            st.warning("המחשב טוען שהטבלה ריקה.")
        else:
            st.success(f"נמצאו {len(df_train)} רשומות.")
            st.dataframe(df_train)

    # --- יצירת הגרף ---
    if not df_train.empty and 'Date' in df_train.columns and 'Duration' in df_train.columns:
        # המרה יזומה למספרים ולתאריכים
        df_train['Date'] = pd.to_datetime(df_train['Date'], errors='coerce')
        df_train['Duration'] = pd.to_numeric(df_train['Duration'], errors='coerce')
        
        # ניקוי שורות ריקות שנוצרו בהמרה
        df_train = df_train.dropna(subset=['Date', 'Duration']).sort_values('Date')
        
        st.caption("התקדמות:")
        fig = px.line(df_train, x='Date', y='Duration', markers=True, title="זמן הישארות (דקות)")
        fig.update_traces(line_color='#FFA500')
        st.plotly_chart(fig, use_container_width=True)
    else:
        st.info("אין מספיק נתונים לגרף עדיין.")

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
            fin_str = "כן" if f_fin else "לא"
            row = [str(f_date), str(f_time), f_type, f_am, fin_str, f_note]
            if append_row("Feeding", row):
                st.success("נשמר!")
                st.rerun()

    st.divider()
    df_food = get_data("Feeding")
    
    if not df_food.empty and 'Date' in df_food.columns and 'Amount' in df_food.columns:
        df_food['Date'] = pd.to_datetime(df_food['Date'], errors='coerce')
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
    
    if not df_tasks.empty and 'Status' in df_tasks.columns and 'TaskName' in df_tasks.columns:
        active = df_tasks[df_tasks['Status'] == 'Active']['TaskName'].tolist()
    
    if active:
        sel_task = st.selectbox("בחר תרגיל", active)
        c1, c2 = st.columns(2)
        with c1: l_date = st.date_input("תאריך", datetime.now(), key="l_d")
        with c2: 
            l_score = st.slider("ציון", 1, 5, 3, key="l_s")
            l_note = st.text_input("הערות", key="l_n")
            
        if st.button("תיעוד ביצוע"):
            if append_row("TaskLogs", [str(l_date), sel_task, l_score, l_note]):
                st.success("תועד!")
                st.rerun()
