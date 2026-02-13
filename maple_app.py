import streamlit as st
import pandas as pd
import gspread
from oauth2client.service_account import ServiceAccountCredentials
from datetime import datetime
import plotly.express as px

# --- 1. הגדרת עמוד חייבת להיות ראשונה ---
st.set_page_config(page_title="היומן של מייפל", page_icon="🐕")

# --- הגדרות ---
SHEET_NAME = "Maple Data" 

# --- 2. חיבור לגוגל עם Cache (מונע חסימות) ---
# הפונקציה הזו תרוץ רק פעם אחת ותשמור את החיבור בזיכרון
@st.cache_resource
def get_client():
    scope = ['https://spreadsheets.google.com/feeds', 'https://www.googleapis.com/auth/drive']
    creds_dict = st.secrets["gcp_service_account"]
    creds = ServiceAccountCredentials.from_json_keyfile_dict(creds_dict, scope)
    return gspread.authorize(creds)

def get_worksheet(worksheet_name):
    client = get_client()
    return client.open(SHEET_NAME).worksheet(worksheet_name)

# --- 3. טעינת נתונים עם Cache (מונע חסימות) ---
# הפונקציה הזו תרענן נתונים רק אם עברו 60 שניות או אם ביקשנו ידנית
@st.cache_data(ttl=60)
def load_data(worksheet_name):
    try:
        sheet = get_worksheet(worksheet_name)
        data = sheet.get_all_records()
        return pd.DataFrame(data)
    except Exception as e:
        return pd.DataFrame()

# --- עיצוב הכותרת ---
st.title("🐕 המעקב של מייפל")

# יצירת הטאבים
tab1, tab2, tab3 = st.tabs(["🏃 אימונים וחשיפה", "🦴 האכלות", "🎓 שיעורי בית"])

# ==========================================
# טאב 1: אימונים
# ==========================================
with tab1:
    st.header("תיעוד חשיפה ונטישות")
    
    with st.expander("📝 הוסף תרגול חשיפה", expanded=False):
        col1, col2 = st.columns(2)
        with col1:
            d_date = st.date_input("תאריך", datetime.now(), key="train_date")
            d_duration = st.number_input("זמן (דקות)", min_value=1, step=1, key="train_duration")
        with col2:
            d_stress = st.slider("רמת לחץ (1-רגועה, 5-פאניקה)", 1, 5, 1, key="train_stress")
            d_notes = st.text_area("הערות", key="train_notes")

        if st.button("שמור תרגול", key="save_train"):
            try:
                sheet = get_worksheet("Sheet1")
                date_str = d_date.strftime("%Y-%m-%d")
                sheet.append_row([date_str, d_duration, d_stress, d_notes])
                # מנקים את הזיכרון כדי שנראה את העדכון מיד
                st.cache_data.clear()
                st.success("התרגול נשמר!")
                st.rerun()
            except Exception as e:
                st.error(f"שגיאה בשמירה: {e}")
    
    # גרף התקדמות
    df_train = load_data("Sheet1")
    if not df_train.empty and 'Date' in df_train.columns:
        df_train['Date'] = pd.to_datetime(df_train['Date'])
        df_train = df_train.sort_values(by='Date')
        
        st.divider()
        st.caption("התקדמות בזמני הישארות לבד:")
        fig = px.line(df_train, x='Date', y='Duration', markers=True)
        fig.update_traces(line_color='#FFA500')
        st.plotly_chart(fig, use_container_width=True)

# ==========================================
# טאב 2: האכלות
# ==========================================
with tab2:
    st.header("יומן אכילה")
    
    df_food = load_data("Feeding")
    default_amount = 100
    
    # ניסיון לקחת כמות אחרונה
    if not df_food.empty:
        try:
            # לוקח את השורה האחרונה בטבלה
            last_val = df_food.iloc[-1]['Amount']
            default_amount = int(last_val)
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
            try:
                sheet = get_worksheet("Feeding")
                date_str = f_date.strftime("%Y-%m-%d")
                time_str = f_time.strftime("%H:%M")
                finished_str = "כן" if f_finished else "לא"
                sheet.append_row([date_str, time_str, f_type, f_amount, finished_str, f_notes])
                
                st.cache_data.clear() # רענון נתונים
                st.success("נשמר.")
                st.rerun()
            except Exception as e:
                st.error(f"שגיאה: {e}")

    # גרפים וסטטיסטיקה לאוכל
    if not df_food.empty and 'Date' in df_food.columns:
        st.divider()
        df_food['Date'] = pd.to_datetime(df_food['Date'])
        
        daily_food = df_food.groupby('Date')['Amount'].sum().reset_index()
        
        st.caption("כמות אוכל יומית (גרם):")
        fig_food = px.bar(daily_food, x='Date', y='Amount')
        fig_food.update_traces(marker_color='#4CAF50')
        st.plotly_chart(fig_food, use_container_width=True)
        
        with st.expander("היסטוריית ארוחות מלאה"):
            st.dataframe(df_food.sort_values(by=['Date', 'Time'], ascending=False), use_container_width=True)

# ==========================================
# טאב 3: שיעורי בית
# ==========================================
with tab3:
    st.header("ניהול משימות אילוף")

    df_tasks = load_data("Tasks")
    
    # --- הוספת תרגיל ---
    with st.expander("➕ הגדר תרגיל חדש (הוראות מאלף)"):
        with st.form("new_task_form"):
            t_name = st.text_input("שם התרגיל (למשל: הרגעה על שטיח)")
            t_freq = st.text_input("תדירות רצויה")
            t_desc = st.text_area("דגשים")
            submitted = st.form_submit_button("צור תרגיל")
            
            if submitted and t_name:
                try:
                    sheet_tasks = get_worksheet("Tasks")
                    sheet_tasks.append_row([t_name, t_freq, t_desc, "Active"])
                    st.cache_data.clear()
                    st.success(f"התרגיל '{t_name}' נוסף!")
                    st.rerun()
                except Exception as e:
                    st.error(f"שגיאה: {e}")

    st.divider()

    # --- ביצוע תרגיל ---
    st.subheader("✅ ביצוע תרגיל")
    
    active_tasks = []
    if not df_tasks.empty and 'Status' in df_tasks.columns:
        active_tasks = df_tasks[df_tasks['Status'] == 'Active']['TaskName'].tolist()
    
    if not active_tasks:
        st.info("אין תרגילים פעילים.")
    else:
        selected_task = st.selectbox("בחר תרגיל:", active_tasks)
        
        # הצגת פרטים
        task_row = df_tasks[df_tasks['TaskName'] == selected_task]
        if not task_row.empty:
            t_info = task_row.iloc[0]
            st.info(f"💡 **דגשים:** {t_info.get('Description', '')} \n\n 📅 **תדירות:** {t_info.get('Frequency', '')}")
        
        col_log1, col_log2 = st.columns(2)
        with col_log1:
            log_date = st.date_input("תאריך", datetime.now(), key="log_date")
            use_score = st.checkbox("להוסיף ציון?", value=False)
        with col_log2:
            log_score = st.slider("איך הלך? (1-5)", 1, 5, 3) if use_score else ""
            log_notes = st.text_area("הערות ביצוע", key="log_notes")
            
        if st.button("תיעוד ביצוע", key="save_log"):
            try:
                sheet_logs = get_worksheet("TaskLogs")
                d_str = log_date.strftime("%Y-%m-%d")
                sheet_logs.append_row([d_str, selected_task, log_score, log_notes])
                st.cache_data.clear()
                st.balloons()
                st.success("נשמר!")
                st.rerun()
            except Exception as e:
                st.error(f"שגיאה: {e}")

    # --- סטטיסטיקה למשימות ---
    df_logs = load_data("TaskLogs")
    
    if not df_logs.empty and 'TaskName' in df_logs.columns:
        st.divider()
        st.subheader("📊 ניתוח התקדמות")

        col_stat1, col_stat2 = st.columns(2)
        
        with col_stat1:
            st.caption("כמות תרגולים:")
            task_counts = df_logs['TaskName'].value_counts().reset_index()
            task_counts.columns = ['TaskName', 'Count']
            fig_c = px.bar(task_counts, x='TaskName', y='Count', color='TaskName')
            st.plotly_chart(fig_c, use_container_width=True)
            
        with col_stat2:
            st.caption("מגמת הצלחה:")
            if 'Success' in df_logs.columns:
                # המרה למספרים וניקוי שורות ריקות
                df_logs['Success'] = pd.to_numeric(df_logs['Success'], errors='coerce')
                df_scores = df_logs.dropna(subset=['Success'])
                
                if not df_scores.empty:
                    daily_scores = df_scores.groupby(['Date', 'TaskName'])['Success'].mean().reset_index()
                    fig_t = px.line(daily_scores, x='Date', y='Success', color='TaskName', markers=True)
                    fig_t.update_yaxes(range=[0, 5.5])
                    st.plotly_chart(fig_t, use_container_width=True)
                else:
                    st.info("אין מספיק נתונים לגרף מגמה")
