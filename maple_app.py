import streamlit as st
import pandas as pd
import gspread
from oauth2client.service_account import ServiceAccountCredentials
from datetime import datetime, time
import plotly.express as px

# --- הגדרות ---
SHEET_NAME = "Maple Data" 

# --- פונקציה לחיבור לגוגל שיטס ---
def get_google_sheet(worksheet_name):
    scope = ['https://spreadsheets.google.com/feeds', 'https://www.googleapis.com/auth/drive']
    creds_dict = st.secrets["gcp_service_account"]
    creds = ServiceAccountCredentials.from_json_keyfile_dict(creds_dict, scope)
    client = gspread.authorize(creds)
    return client.open(SHEET_NAME).worksheet(worksheet_name)

# --- פונקציות טעינה ושמירה כלליות ---
def load_data(worksheet_name):
    try:
        sheet = get_google_sheet(worksheet_name)
        data = sheet.get_all_records()
        return pd.DataFrame(data)
    except Exception as e:
        # אם אין נתונים או הגיליון ריק, נחזיר דאטה-פריים ריק כדי לא להקריס את האפליקציה
        return pd.DataFrame()

# --- עיצוב האפליקציה ---
st.set_page_config(page_title="היומן של מייפל", page_icon="🐕")
st.title("🐕 המעקב של מייפל")

# יצירת הטאבים - הוספנו טאב שלישי
tab1, tab2, tab3 = st.tabs(["🏃 אימונים וחשיפה", "🦴 האכלות", "🎓 שיעורי בית"])

# ==========================================
# טאב 1: אימונים (קיים)
# ==========================================
with tab1:
    st.header("תיעוד יציאה מהבית")
    
    with st.expander("📝 הוסף תרגול יציאה", expanded=False):
        col1, col2 = st.columns(2)
        with col1:
            d_date = st.date_input("תאריך", datetime.now(), key="train_date")
            d_duration = st.number_input("זמן (דקות)", min_value=1, step=1, key="train_duration")
        with col2:
            d_stress = st.slider("רמת לחץ (1-רגועה, 5-פאניקה)", 1, 5, 1, key="train_stress")
            d_notes = st.text_area("הערות", key="train_notes")

        if st.button("שמור תרגול", key="save_train"):
            try:
                sheet = get_google_sheet("Sheet1")
                date_str = d_date.strftime("%Y-%m-%d")
                sheet.append_row([date_str, d_duration, d_stress, d_notes])
                st.success("התרגול נשמר!")
                st.rerun()
            except Exception as e:
                st.error(f"שגיאה: {e}")
    
    # גרף התקדמות
    df_train = load_data("Sheet1")
    if not df_train.empty and 'Date' in df_train.columns:
        df_train['Date'] = pd.to_datetime(df_train['Date'])
        df_train = df_train.sort_values(by='Date')
        st.caption("התקדמות בזמני הישארות לבד:")
        fig = px.line(df_train, x='Date', y='Duration', markers=True)
        fig.update_traces(line_color='#FFA500')
        st.plotly_chart(fig, use_container_width=True)


# ==========================================
# טאב 2: האכלות (קיים)
# ==========================================
with tab2:
    st.header("יומן אכילה")
    
    df_food = load_data("Feeding")
    default_amount = 100
    if not df_food.empty:
        try:
            default_amount = int(df_food.iloc[-1]['Amount'])
        except: pass

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
                sheet = get_google_sheet("Feeding")
                date_str = f_date.strftime("%Y-%m-%d")
                time_str = f_time.strftime("%H:%M")
                finished_str = "כן" if f_finished else "לא"
                sheet.append_row([date_str, time_str, f_type, f_amount, finished_str, f_notes])
                st.success("נשמר.")
                st.rerun()
            except Exception as e:
                st.error(f"שגיאה: {e}")

# ==========================================
    # גרפים וסטטיסטיקה לאוכל (להוסיף בטאב 2)
    # ==========================================
    if not df_food.empty and 'Date' in df_food.columns:
        st.divider()
        
        # המרת תאריך לפורמט מתאים לגרף
        df_food['Date'] = pd.to_datetime(df_food['Date'])
        
        # חישוב סך הכל יומי
        daily_food = df_food.groupby('Date')['Amount'].sum().reset_index()
        
        st.caption("כמות אוכל יומית (גרם):")
        # יצירת גרף עמודות ירוק
        fig_food = px.bar(daily_food, x='Date', y='Amount')
        fig_food.update_traces(marker_color='#4CAF50') # צבע ירוק
        st.plotly_chart(fig_food, use_container_width=True)
        
        # טבלה מלאה למי שרוצה לראות היסטוריה
        with st.expander("היסטוריית ארוחות מלאה"):
            # מציג את הארוחות מהחדש לישן
            st.dataframe(df_food.sort_values(by=['Date', 'Time'], ascending=False), use_container_width=True)

# ==========================================
# טאב 3: שיעורי בית (חדש!)
# ==========================================
with tab3:
    st.header("ניהול משימות אילוף")

    # טעינת המשימות הקיימות
    df_tasks = load_data("Tasks")
    
    # --- חלק א: הוספת סוג תרגיל חדש ---
    with st.expander("➕ הגדר תרגיל חדש (הוראות מאלף)"):
        with st.form("new_task_form"):
            t_name = st.text_input("שם התרגיל (למשל: הרגעה על שטיח)")
            t_freq = st.text_input("תדירות רצויה (למשל: פעמיים ביום)")
            t_desc = st.text_area("דגשים והוראות ביצוע")
            submitted = st.form_submit_button("צור תרגיל")
            
            if submitted and t_name:
                try:
                    sheet_tasks = get_google_sheet("Tasks")
                    # עמודה 4 היא הסטטוס, נקבע אוטומטית כ-Active
                    sheet_tasks.append_row([t_name, t_freq, t_desc, "Active"])
                    st.success(f"התרגיל '{t_name}' נוסף לרשימה!")
                    st.rerun()
                except Exception as e:
                    st.error(f"שגיאה בשמירה: {e}")

    st.divider()

    # --- חלק ב: ביצוע תרגיל (Log) ---
    st.subheader("✅ ביצוע תרגיל")
    
    # סינון רק משימות פעילות
    active_tasks = []
    if not df_tasks.empty:
        # מוודאים שהעמודות קיימות ומסננים
        if 'Status' in df_tasks.columns and 'TaskName' in df_tasks.columns:
            active_tasks = df_tasks[df_tasks['Status'] == 'Active']['TaskName'].tolist()
    
    if not active_tasks:
        st.info("אין כרגע תרגילים פעילים. הוסף תרגיל למעלה.")
    else:
        selected_task = st.selectbox("בחר תרגיל לביצוע:", active_tasks)
        
        # הצגת ההוראות לתרגיל הנבחר (כדי שלא נשכח מה המאלף אמר)
        task_info = df_tasks[df_tasks['TaskName'] == selected_task].iloc[0]
        st.info(f"💡 **דגשים:** {task_info['Description']} \n\n 📅 **תדירות:** {task_info['Frequency']}")
        
        col_log1, col_log2 = st.columns(2)
        with col_log1:
            log_date = st.date_input("תאריך הביצוע", datetime.now(), key="log_date")
            # אופציה למדד הצלחה
            use_score = st.checkbox("להוסיף ציון הצלחה?", value=False)
            
        with col_log2:
            log_score = None
            if use_score:
                log_score = st.slider("איך הלך? (1-גרוע, 5-מעולה)", 1, 5, 3)
            log_notes = st.text_area("הערות על הביצוע", key="log_notes")
            
        if st.button("תיעוד ביצוע", key="save_log"):
            try:
                sheet_logs = get_google_sheet("TaskLogs")
                d_str = log_date.strftime("%Y-%m-%d")
                # שומרים את הציון או מחרוזת ריקה אם לא נבחר
                score_to_save = log_score if use_score else "" 
                sheet_logs.append_row([d_str, selected_task, score_to_save, log_notes])
                st.balloons()
                st.success("כל הכבוד למייפל!")
            except Exception as e:
                st.error(f"שגיאה: {e}")

    # --- חלק ג: ניהול ארכיון (אופציונלי - להעביר ללא פעיל) ---
    with st.expander("📂 ניהול ארכיון (הסתרת תרגילים)"):
        # מוודאים שיש משימות כדי לא ליצור שגיאה ב-selectbox
        if active_tasks:
            task_to_archive = st.selectbox("בחר תרגיל להעביר לארכיון:", active_tasks, key="archive_select")
            if st.button("העבר לארכיון"):
                try:
                    sheet_tasks = get_google_sheet("Tasks")
                    # חיפוש השורה המתאימה ועדכון התא הרביעי (Status)
                    # הערה: זה פתרון פשוט שבו אנחנו סורקים את כל השורות עד שמוצאים
                    # במערכת גדולה יותר עדיף מזהה ייחודי, אבל לכאן זה מצוין
                    all_vals = sheet_tasks.get_all_values()
                    # מוצאים את מספר השורה (מתחיל מ-1 בגוגל שיטס)
                    row_idx = -1
                    for i, row in enumerate(all_vals):
                        if len(row) > 0 and row[0] == task_to_archive: # בודקים לפי שם המשימה
                            row_idx = i + 1
                            break
                    
                    if row_idx != -1:
                        sheet_tasks.update_cell(row_idx, 4, "Archived") 
                        st.success("התרגיל הועבר לארכיון")
                        st.rerun()
                    else:
                        st.warning("לא נמצאה השורה בגיליון")
                except Exception as e:
                    st.error(f"שגיאה בארכיון: {e}")

    # --- חלק ד: טבלה מסכמת אחרונה ---
    st.divider()
    st.caption("היסטוריית ביצועים אחרונה:")
    df_logs = load_data("TaskLogs")
    if not df_logs.empty:
        st.dataframe(df_logs.sort_values(by='Date', ascending=False).head(10), use_container_width=True)

# ==========================================
    # גרפים וסטטיסטיקה (להוסיף בסוף טאב 3)
    # ==========================================
    if not df_logs.empty:
        st.divider()
        st.subheader("📊 ניתוח התקדמות")

        # המרת תאריכים ומספרים לפורמט נכון
        df_logs['Date'] = pd.to_datetime(df_logs['Date'])
        # המרת הציון למספר (אם כתוב כלום זה יהיה NaN)
        df_logs['Success'] = pd.to_numeric(df_logs['Success'], errors='coerce')

        col_stat1, col_stat2 = st.columns(2)

        # גרף 1: כמות תרגולים (התמדה)
        with col_stat1:
            st.caption("כמות תרגולים לפי סוג:")
            # ספירה כמה פעמים עשינו כל תרגיל
            task_counts = df_logs['TaskName'].value_counts().reset_index()
            task_counts.columns = ['TaskName', 'Count']
            
            fig_count = px.bar(task_counts, x='TaskName', y='Count', color='TaskName')
            st.plotly_chart(fig_count, use_container_width=True)

        # גרף 2: שיפור בציונים (רק אם יש ציונים)
        with col_stat2:
            st.caption("מגמת הצלחה (ציונים 1-5):")
            # מסננים שורות שאין בהן ציון
            df_scores = df_logs.dropna(subset=['Success'])
            
            if not df_scores.empty:
                # ממוצע יומי לכל תרגיל (במקרה שעשיתם אותו תרגיל פעמיים ביום)
                daily_scores = df_scores.groupby(['Date', 'TaskName'])['Success'].mean().reset_index()
                
                fig_trend = px.line(daily_scores, x='Date', y='Success', color='TaskName', markers=True)
                fig_trend.update_yaxes(range=[0, 5.5]) # קיבוע הסקאלה מ-0 עד 5
                st.plotly_chart(fig_trend, use_container_width=True)
            else:
                st.info("עדיין אין נתונים עם ציוני הצלחה להצגה.")

