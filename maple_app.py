import streamlit as st
import pandas as pd
import gspread
from oauth2client.service_account import ServiceAccountCredentials
from datetime import datetime
import plotly.express as px

# --- הגדרות דף ---
st.set_page_config(page_title="היומן של מייפל", page_icon="🐕", layout="wide")

# --- CSS RTL מתוקן ---
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

def update_data(worksheet_name, df):
    """פונקציה לעדכון הטבלה כולה (עריכה)"""
    try:
        sheet = get_worksheet(worksheet_name)
        sheet.clear() # מנקה את הגיליון
        # מכין את הנתונים לכתיבה מחדש
        data = [df.columns.tolist()] + df.astype(str).values.tolist()
        sheet.update(data) 
        st.cache_data.clear()
        return True
    except Exception as e:
        st.error(f"שגיאה בעדכון: {e}")
        return False

# --- האפליקציה ---
st.title("🐕 המעקב של מייפל")

tab1, tab2, tab3 = st.tabs(["🏃 הישארות לבד", "🦴 האכלות", "🎓 משימות"])

# --- טאב 1: אימונים (Training) ---
with tab1:
    st.header("תיעוד חשיפה ונטישות")
    
    # --- חלק א: הוספה חדשה ---
    with st.form("train_form", clear_on_submit=True):
        st.subheader("📝 הוספת חדש")
        c1, c2, c3 = st.columns(3)
        with c1:
            d_date = st.date_input("תאריך", datetime.now())
        with c2:
            d_time = st.time_input("שעה", datetime.now().time())
        with c3:
            # שינוי לדקות -> שעות, כולל פורמט עשרוני
            d_dur = st.number_input("זמן (שעות)", min_value=0.0, step=0.25, format="%.2f")
            
        c4, c5 = st.columns([1, 2])
        with c4:
            d_stress = st.select_slider("לחץ (1-5)", options=[1, 2, 3, 4, 5], value=3)
        with c5:
            d_note = st.text_input("הערות")
            
        if st.form_submit_button("שמור 💾"):
            row = [str(d_date), str(d_time), d_dur, d_stress, d_note]
            if append_row("Training", row):
                st.success("נשמר!")
                st.rerun()

    st.divider()
    
    # --- חלק ב: עריכה וגרף ---
    st.subheader("✏️ עריכת היסטוריה")
    df_train = get_data("Training")
    
    if not df_train.empty:
        edited_df = st.data_editor(df_train, num_rows="dynamic", use_container_width=True, key="train_editor")
        
        if st.button("עדכן שינויים בטבלה 🔄", key="upd_btn"):
            if update_data("Training", edited_df):
                st.success("עודכן!")
                st.rerun()

        # הגרף
        st.divider()
        if 'Date' in df_train.columns and 'Duration' in df_train.columns:
            df_chart = df_train.copy()
            df_chart['Date'] = pd.to_datetime(df_chart['Date'], errors='coerce')
            df_chart['Duration'] = pd.to_numeric(df_chart['Duration'], errors='coerce')
            df_chart = df_chart.dropna(subset=['Date', 'Duration']).sort_values('Date')

            # עדכון הכותרות לשעות
            fig = px.line(df_chart, x='Date', y='Duration', markers=True, 
                          title="זמן אימון (שעות)", labels={'Date':'', 'Duration':''})
            fig.update_traces(line_color='#FFA500', marker_size=8)
            fig.update_xaxes(dtick="D1", tickformat="%d/%m")
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
            # שינוי לגרמים -> כוסות, ערך התחלתי 1.0
            f_am = st.number_input("כמות (כוסות)", value=1.0, step=0.25, format="%.2f", help="1 כוס = 400 גרם")
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
        
        # עדכון כותרת הגרף לכוסות
        st.caption("📊 כמות אוכל יומית (כוסות):")
        st.plotly_chart(px.bar(daily, x='Date', y='Amount', color_discrete_sequence=['#4CAF50']), use_container_width=True)
        
        # --- תוספת: טבלה להיסטוריית האכלות ---
        st.divider()
        st.subheader("📋 היסטוריית האכלות מלאה")
        with st.expander("לחץ להצגת הטבלה"):
             st.dataframe(df_food.sort_values(by='Date', ascending=False), use_container_width=True)

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
    
    st.divider()
    st.subheader("📊 היסטוריית ביצועים")

    # קריאת הנתונים מהגיליון TaskLogs
    df_logs = get_data("TaskLogs")

    if not df_logs.empty:
        # המרה לפורמט תאריך ומספר כדי שהגרף יעבוד
        if 'Date' in df_logs.columns:
            df_logs['Date'] = pd.to_datetime(df_logs['Date'], errors='coerce')
        if 'Success' in df_logs.columns:
            df_logs['Success'] = pd.to_numeric(df_logs['Success'], errors='coerce')

        # הצגת גרף נקודות (Scatter) - הכי מתאים לציונים בודדים
        if 'Date' in df_logs.columns and 'Success' in df_logs.columns:
            # מיון לפי תאריך
            df_logs = df_logs.sort_values('Date')
            
            fig_task = px.scatter(df_logs, x='Date', y='Success', color='TaskName',
                                  title="מעקב הצלחה לפי תרגיל",
                                  labels={'Success': 'ציון (1-5)', 'Date': 'תאריך'})
            # קובע שהציר יהיה תמיד מ-1 עד 5
            fig_task.update_yaxes(range=[0.5, 5.5], dtick=1) 
            # תיקון לציר ה-X שלא יראה שעות
            fig_task.update_xaxes(dtick="D1", tickformat="%d/%m")
            
            st.plotly_chart(fig_task, use_container_width=True)

        # הצגת הטבלה המלאה למטה
        with st.expander("ראה טבלה מלאה"):
            st.dataframe(df_logs, use_container_width=True)
    else:
        st.info("עדיין אין נתונים ביומן הביצועים (TaskLogs).")

