import streamlit as st
import pandas as pd
from datetime import datetime
import plotly.express as px
from streamlit_gsheets import GSheetsConnection

# --- 1. הגדרות דף ועיצוב RTL ---
st.set_page_config(page_title="היומן של מייפל", page_icon="🐕", layout="wide")

st.markdown("""
    <style>
    @import url('https://fonts.googleapis.com/css2?family=Rubik:wght@400;700&display=swap');
    
    html, body, [data-testid="stAppViewContainer"], [data-testid="stHeader"] {
        direction: RTL;
        text-align: right;
        font-family: 'Rubik', sans-serif;
    }
    
    [data-baseweb="tab-list"] {
        direction: RTL;
        display: flex;
        justify-content: flex-end;
    }
    
    input, textarea, .stSelectbox, .stNumberInput {
        direction: RTL;
        text-align: right;
    }
    
    .streamlit-expanderHeader {
        direction: RTL;
    }
    </style>
    """, unsafe_allow_html=True)

# --- 2. חיבור נתונים ---
conn = st.connection("gsheets", type=GSheetsConnection)

def get_data(worksheet_name):
    """קריאת נתונים ללא שמירה בזיכרון (TTL=0) כדי לראות שינויים מיד"""
    try:
        df = conn.read(worksheet=worksheet_name, ttl=0)
        # ניקוי שורות ריקות לחלוטין שאולי גוגל שיטס מחזיר
        df = df.dropna(how='all')
        return df
    except Exception:
        return pd.DataFrame()

def append_row(worksheet_name, new_data_dict):
    try:
        existing_df = get_data(worksheet_name)
        new_row = pd.DataFrame([new_data_dict])
        
        # וידוא שאין עמודות מיותרות
        updated_df = pd.concat([existing_df, new_row], ignore_index=True)
        
        conn.update(worksheet=worksheet_name, data=updated_df)
        st.cache_data.clear()
        return True
    except Exception as e:
        st.error(f"שגיאה בשמירה: {e}")
        return False

# --- כותרת ---
st.title("🐕 המעקב של מייפל")

# יצירת הטאבים
tab1, tab2, tab3 = st.tabs(["🏃 אימונים וחשיפה", "🦴 האכלות", "🎓 שיעורי בית"])

# ==========================================
# טאב 1: אימונים (Training) - השם החדש
# ==========================================
with tab1:
    st.header("תיעוד חשיפה ונטישות")
    
    # טופס הוספה
    with st.expander("📝 הוסף תרגול חשיפה", expanded=False):
        col1, col2 = st.columns(2)
        with col1:
            d_date = st.date_input("תאריך", datetime.now(), key="train_date")
            d_duration = st.number_input("זמן (דקות)", min_value=1, step=1, key="train_duration")
        with col2:
            d_stress = st.slider("רמת לחץ (1-רגועה, 5-פאניקה)", 1, 5, 1, key="train_stress")
            d_notes = st.text_area("הערות", key="train_notes")

        if st.button("שמור תרגול", key="save_train"):
            row_data = {
                "Date": d_date.strftime("%Y-%m-%d"),
                "Duration": d_duration,
                "StressLevel": d_stress,
                "Notes": d_notes
            }
            # כאן שינינו את השם ל-Training
            if append_row("Training", row_data):
                st.success("התרגול נשמר! רענן את הדף אם הנתונים לא מופיעים מיד.")
                st.rerun()
    
    # תצוגת נתונים וגרף
    st.divider()
    
    # קריאה מהטאב החדש Training
    df_train = get_data("Training")
    
    # בדיקה שהעמודות הנכונות קיימות (פותר את הבעיה שהקוד "לא ניגש לקובץ")
    required_columns = ['Date', 'Duration']
    
    if df_train.empty:
         st.info("הגליון 'Training' נראה ריק כרגע. נסה להוסיף תרגול חדש.")
         
    elif not all(col in df_train.columns for col in required_columns):
        st.error(f"⚠️ שגיאה בקריאת העמודות. ודא שבגוגל שיטס בטאב Training שורה 1 מכילה את הכותרות: Date, Duration")
        st.write("העמודות שנמצאו בפועל:", df_train.columns.tolist())
        
    else:
        # עיבוד נתונים לגרף
        df_train['Date'] = pd.to_datetime(df_train['Date'], errors='coerce')
        df_train['Duration'] = pd.to_numeric(df_train['Duration'], errors='coerce')
        df_train = df_train.dropna(subset=['Date', 'Duration']).sort_values(by='Date')
        
        st.caption("התקדמות בזמני הישארות לבד:")
        fig = px.line(df_train, x='Date', y='Duration', markers=True, title="משך זמן (דקות) לאורך זמן")
        fig.update_traces(line_color='#FFA500')
        st.plotly_chart(fig, use_container_width=True)
        
        with st.expander("ראה היסטוריה מלאה"):
            st.dataframe(df_train, use_container_width=True)

# ==========================================
# טאב 2: האכלות (Feeding)
# ==========================================
with tab2:
    st.header("יומן אכילה")
    
    df_food = get_data("Feeding")
    default_amount = 100
    
    if not df_food.empty and 'Amount' in df_food.columns:
        try:
            last_val = df_food.iloc[-1]['Amount']
            default_amount = int(float(last_val))
        except:
            pass

    with st.expander("🍖 הוסף ארוחה", expanded=False):
        f_col1, f_col2 = st.columns(2)
        with f_col1:
            f_date = st.date_input("תאריך", datetime.now(), key="food_date")
            f_time = st.time_input("שעה", datetime.now().time(), key="food_time")
            f_type = st.selectbox("איזו ארוחה?", ["בוקר", "ערב", "אחר"], key="food_type")
        with f_col2:
            f_amount = st.number_input("כמות (גרם)", value=default_amount, step=10, key="food_amount")
            f_finished = st.checkbox("סיימה הכל?", value=True, key="food_finished")
            f_notes = st.text_input("הערות", key="food_notes")

        if st.button("שמור ארוחה", key="save_food"):
            row_data = {
                "Date": f_date.strftime("%Y-%m-%d"),
                "Time": f_time.strftime("%H:%M"),
                "Type": f_type,
                "Amount": f_amount,
                "Finished": "כן" if f_finished else "לא",
                "Notes": f_notes
            }
            if append_row("Feeding", row_data):
                st.success("נשמר.")
                st.rerun()

    if not df_food.empty and 'Date' in df_food.columns:
        st.divider()
        df_food['Date'] = pd.to_datetime(df_food['Date'], errors='coerce')
        df_food['Amount'] = pd.to_numeric(df_food['Amount'], errors='coerce').fillna(0)
        
        daily_food = df_food.groupby('Date')['Amount'].sum().reset_index()
        
        st.caption("כמות אוכל יומית (גרם):")
        fig_food = px.bar(daily_food, x='Date', y='Amount')
        fig_food.update_traces(marker_color='#4CAF50')
        st.plotly_chart(fig_food, use_container_width=True)

# ==========================================
# טאב 3: שיעורי בית (Tasks & TaskLogs)
# ==========================================
with tab3:
    st.header("ניהול משימות אילוף")

    with st.expander("➕ הגדר תרגיל חדש"):
        with st.form("new_task_form"):
            t_name = st.text_input("שם התרגיל")
            t_freq = st.text_input("תדירות רצויה")
            t_desc = st.text_area("דגשים")
            submitted = st.form_submit_button("צור תרגיל")
            
            if submitted and t_name:
                row_data = {"TaskName": t_name, "Frequency": t_freq, "Description": t_desc, "Status": "Active"}
                if append_row("Tasks", row_data):
                    st.success("התרגיל נוסף!")
                    st.rerun()

    st.divider()
    df_tasks = get_data("Tasks")
    active_tasks = []
    if not df_tasks.empty and 'Status' in df_tasks.columns:
        active_tasks = df_tasks[df_tasks['Status'] == 'Active']['TaskName'].tolist()
    
    if active_tasks:
        selected_task = st.selectbox("בחר תרגיל:", active_tasks)
        
        col_log1, col_log2 = st.columns(2)
        with col_log1:
            log_date = st.date_input("תאריך", datetime.now(), key="log_date")
        with col_log2:
            log_score = st.slider("איך הלך? (1-5)", 1, 5, 3)
            log_notes = st.text_area("הערות ביצוע", key="log_notes")
            
        if st.button("תיעוד ביצוע", key="save_log"):
            row_data = {"Date": log_date.strftime("%Y-%m-%d"), "TaskName": selected_task, "Success": log_score, "Notes": log_notes}
            if append_row("TaskLogs", row_data):
                st.success("נשמר!")
                st.rerun()
    else:
         st.info("אין תרגילים פעילים.")
