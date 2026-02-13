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
    # פותח את הטאב הספציפי שביקשנו (אימונים או אוכל)
    return client.open(SHEET_NAME).worksheet(worksheet_name)

# --- פונקציות טעינה ושמירה כלליות ---
def load_data(worksheet_name):
    try:
        sheet = get_google_sheet(worksheet_name)
        data = sheet.get_all_records()
        return pd.DataFrame(data)
    except Exception as e:
        return pd.DataFrame()

# --- עיצוב האפליקציה ---
st.set_page_config(page_title="היומן של מייפל", page_icon="🐕")
st.title("🐕 המעקב של מייפל")

# יצירת הטאבים
tab1, tab2 = st.tabs(["🏃 אימונים וחשיפה", "bone: האכלות"])

# ==========================================
# טאב 1: אימונים (הקוד הישן והטוב)
# ==========================================
with tab1:
    st.header("תיעוד חשיפה")
    
    with st.expander("📝 הוסף תרגול חדש", expanded=True):
        col1, col2 = st.columns(2)
        with col1:
            d_date = st.date_input("תאריך", datetime.now(), key="train_date")
            d_duration = st.number_input("זמן (דקות)", min_value=1, step=1, key="train_duration")
        with col2:
            d_stress = st.slider("רמת לחץ (1-רגועה, 5-פאניקה)", 1, 5, 1, key="train_stress")
            d_notes = st.text_area("הערות", key="train_notes")

        if st.button("שמור תרגול", key="save_train"):
            try:
                sheet = get_google_sheet("Sheet1") # הגיליון הראשון המקורי
                date_str = d_date.strftime("%Y-%m-%d")
                sheet.append_row([date_str, d_duration, d_stress, d_notes])
                st.success("התרגול נשמר!")
                st.rerun()
            except Exception as e:
                st.error(f"שגיאה: {e}")

    # גרפים לאימון
    df_train = load_data("Sheet1")
    if not df_train.empty and 'Date' in df_train.columns:
        df_train['Date'] = pd.to_datetime(df_train['Date'])
        df_train = df_train.sort_values(by='Date')
        
        st.divider()
        st.caption("התקדמות בזמני הישארות לבד:")
        fig = px.line(df_train, x='Date', y='Duration', markers=True)
        fig.update_traces(line_color='#FFA500') # כתום
        st.plotly_chart(fig, use_container_width=True)

# ==========================================
# טאב 2: האכלות (החדש!)
# ==========================================
with tab2:
    st.header("יומן אכילה")
    
    # טעינת נתונים קיימים כדי למצוא את "הפעם האחרונה"
    df_food = load_data("Feeding")
    
    # ברירות מחדל - אם יש היסטוריה, ניקח ממנה
    default_amount = 100
    default_time = datetime.now().time()
    
    if not df_food.empty:
        last_row = df_food.iloc[-1]
        try:
            default_amount = int(last_row['Amount'])
            # אם נרצה גם את השעה האחרונה אפשר, אבל לרוב עדיף שעה נוכחית
        except:
            pass

    with st.expander("🍖 הוסף ארוחה", expanded=True):
        f_col1, f_col2 = st.columns(2)
        
        with f_col1:
            f_date = st.date_input("תאריך", datetime.now(), key="food_date")
            f_time = st.time_input("שעה", default_time, key="food_time")
            f_type = st.selectbox("איזו ארוחה?", ["בוקר", "ערב", "אחר"], key="food_type")
        
        with f_col2:
            f_amount = st.number_input("כמות (גרם)", value=default_amount, step=10, key="food_amount")
            f_finished = st.checkbox("סיימה הכל מהצלחת?", value=True, key="food_finished")
            f_notes = st.text_input("הערות (למשל: אכלה רק כשחזרנו)", key="food_notes")

        if st.button("שמור ארוחה", key="save_food"):
            try:
                sheet = get_google_sheet("Feeding")
                date_str = f_date.strftime("%Y-%m-%d")
                time_str = f_time.strftime("%H:%M")
                finished_str = "כן" if f_finished else "לא (נזרק)"
                
                sheet.append_row([date_str, time_str, f_type, f_amount, finished_str, f_notes])
                st.success("בתאבון למייפל! נשמר.")
                st.rerun()
            except Exception as e:
                st.error(f"וודאו שיצרתם את הגיליון 'Feeding' בגוגל שיטס! שגיאה: {e}")

    # סטטיסטיקה לאוכל
    if not df_food.empty and 'Date' in df_food.columns:
        st.divider()
        df_food['Date'] = pd.to_datetime(df_food['Date'])
        
        # גרף כמות יומית
        daily_food = df_food.groupby('Date')['Amount'].sum().reset_index()
        
        st.caption("כמות אוכל יומית (גרם):")
        fig_food = px.bar(daily_food, x='Date', y='Amount', title="צריכה יומית")
        fig_food.update_traces(marker_color='#4CAF50') # ירוק
        st.plotly_chart(fig_food, use_container_width=True)
        
        with st.expander("היסטוריית ארוחות מלאה"):
            st.dataframe(df_food.sort_values(by=['Date', 'Time'], ascending=False), use_container_width=True)
