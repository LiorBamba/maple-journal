import streamlit as st
import pandas as pd
import gspread
from oauth2client.service_account import ServiceAccountCredentials
from datetime import datetime
import plotly.express as px

# --- הגדרות דף ---
st.set_page_config(page_title="היומן של מייפל", page_icon="🐕", layout="wide")

# --- CSS RTL מתוקן ---
# הוספתי תיקונים ספציפיים כדי שהסליידרים והטפסים יראו טוב
st.markdown("""
    <style>
    @import url('https://fonts.googleapis.com/css2?family=Rubik:wght@400;700&display=swap');
    
    html, body, [data-testid="stAppViewContainer"], [data-testid="stHeader"] {
        direction: RTL;
        text-align: right;
        font-family: 'Rubik', sans-serif;
    }
    
    /* יישור טאבים */
    [data-baseweb="tab-list"] { 
        direction: RTL; 
        display: flex; 
        justify-content: flex-end; 
    }
    
    /* יישור כללי של אינפוטים */
    input, textarea, .stSelectbox, .stNumberInput { 
        direction: RTL; 
        text-align: right; 
    }
    
    /* תיקון לסליידרים ב-RTL שלא ישברו */
    [data-testid="stSlider"] {
        direction: ltr; /* הסליידר עצמו צריך להיות LTR כדי שהחישובים לא ישברו */
    }
    
    /* יישור כפתורים למרכז/שמאל */
    .stButton button {
        width: 100%;
    }
    </style>
    """, unsafe_allow_html=True)

# --- חיבור לגוגל שיטס ---
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
    try:
        sheet = get_worksheet(worksheet_name)
        all_values = sheet.get_all_values()
        if not all_values: return pd.DataFrame()
        headers = all_values[0]
        data = all_values[1:]
        return pd.DataFrame(data, columns=headers)
    except:
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

tab1, tab2, tab3 = st.tabs(["🏃 אימונים", "🦴 האכלות", "🎓 משימות"])

# --- טאב 1: אימונים (Training) ---
with tab1:
    st.header("תיעוד חשיפה ונטישות")
    
    # שימוש ב-FORM כדי למנוע ריצה חוזרת וקריסות
    with st.form("train_form", clear_on_submit=True):
        st.write("📝 **הוספת תיעוד חדש:**")
        c1, c2 = st.columns(2)
        with c1:
            d_date = st.date_input("תאריך", datetime.now())
            d_dur = st.number_input("זמן (דקות)", min_value=1, step=1)
        with c2:
            # select_slider עובד הרבה יותר טוב ב-RTL מאשר slider רגיל
            d_stress = st.select_slider("רמת לחץ (1=רגועה, 5=פאניקה)", options=[1, 2, 3, 4, 5], value=1)
            d_note = st.text_area("הערות")
            
        submitted = st.form_submit_button("שמור תרגול 💾")
        if submitted:
            row = [str(d_date), d_dur, d_stress, d_note]
            if append_row("Training", row):
                st.success("התרגול נשמר בהצלחה!")
                st.rerun()

    st.divider()
    
    # הצגת נתונים (מחוץ לטופס כדי שיתעדכן)
    df_train = get_data("Training")
    if not df_train.empty and 'Date' in df_train.columns:
        df_train['Date'] = pd.to_datetime(df_train['Date'], errors='coerce')
        df_train['Duration'] = pd.to_numeric(df_train['Duration'], errors='coerce')
        df_train = df_train.sort_values('Date')
        
        st.caption("📊 התקדמות זמן הישארות לבד:")
        fig = px.line(df_train, x='Date', y='Duration', markers=True)
        fig.update_traces(line_color='#FFA500')
        st.plotly_chart(fig, use_container_width=True)

# --- טאב 2: האכלות (Feeding) ---
with tab2:
    st.header("יומן אכילה")
    
    with st.form("food_form", clear_on_submit=True):
        st.write("🍖 **הוספת ארוחה:**")
        c1, c2 = st.columns(2)
        with c1:
            f_date = st.date_input("תאריך", datetime.now())
            f_time = st.time_input("שעה", datetime.now().time())
            f_type = st.selectbox("סוג ארוחה", ["בוקר", "ערב", "אחר"])
        with c2:
            f_am = st.number_input("כמות (גרם)", value=100, step=10)
            f_fin = st.checkbox("האם סיימה הכל?", value=True)
            f_note = st.text_input("הערות נוספות")
            
        submitted_food = st.form_submit_button("שמור ארוחה 💾")
        if submitted_food:
            fin_str = "כן" if f_fin else "לא"
            row = [str(f_date), str(f_time), f_type, f_am, fin_str, f_note]
            if append_row("Feeding", row):
                st.success("הארוחה נשמרה!")
                st.rerun()

    st.divider()
    df_food = get_data("Feeding")
    if not df_food.empty and 'Amount' in df_food.columns:
        df_food['Date'] = pd.to_datetime(df_food['Date'], errors='coerce')
        df_food['Amount'] = pd.to_numeric(df_food['Amount'], errors='coerce').fillna(0)
        daily = df_food.groupby('Date')['Amount'].sum().reset_index()
        st.caption("📊 כמות אוכל יומית (גרם):")
        st.plotly_chart(px.bar(daily, x='Date', y='Amount', color_discrete_sequence=['#4CAF50']), use_container_width=True)

# --- טאב 3: משימות (Tasks) ---
with tab3:
    st.header("ניהול משימות")
    
    # טופס יצירת תרגיל חדש
    with st.expander("➕ יצירת תרגיל חדש במערכת"):
        with st.form("new_task_form", clear_on_submit=True):
            t_name = st.text_input("שם התרגיל")
            t_freq = st.text_input("תדירות (למשל: פעמיים ביום)")
            t_desc = st.text_input("דגשים לביצוע")
            sub_new_task = st.form_submit_button("צור תרגיל")
            
            if sub_new_task and t_name:
                if append_row("Tasks", [t_name, t_freq, t_desc, "Active"]):
                    st.success("התרגיל נוסף לרשימה!")
                    st.rerun()

    st.divider()
    
    # טופס תיעוד ביצוע
    st.subheader("✅ תיעוד ביצוע תרגיל")
    
    df_tasks = get_data("Tasks")
    active_tasks = []
    if not df_tasks.empty and 'TaskName' in df_tasks.columns:
        active_tasks = df_tasks[df_tasks.get('Status', 'Active') == 'Active']['TaskName'].tolist()
    
    if active_tasks:
        with st.form("log_task_form", clear_on_submit=True):
            sel_task = st.selectbox("בחר תרגיל לתיעוד:", active_tasks)
            
            c1, c2 = st.columns(2)
            with c1: 
                l_date = st.date_input("תאריך ביצוע", datetime.now())
            with c2: 
                # שימוש ב-select_slider לשיפור המראה
                l_score = st.select_slider("איך הלך? (1=גרוע, 5=מצויין)", options=[1, 2, 3, 4, 5], value=3)
            
            l_note = st.text_area("הערות על הביצוע")
            
            sub_log = st.form_submit_button("תיעוד ביצוע 💾")
            if sub_log:
                if append_row("TaskLogs", [str(l_date), sel_task, l_score, l_note]):
                    st.success("הביצוע תועד בהצלחה!")
                    st.rerun()
    else:
        st.info("אין תרגילים פעילים. צור תרגיל חדש למעלה.")
