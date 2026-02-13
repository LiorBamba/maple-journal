import streamlit as st
import pandas as pd
import gspread
from oauth2client.service_account import ServiceAccountCredentials
from datetime import datetime
import plotly.express as px

# --- הגדרות ---
SHEET_NAME = "Maple Data"  # וודא שזה השם המדויק של הגיליון שיצרת!

# --- פונקציה לחיבור לגוגל שיטס ---
def get_google_sheet():
    # הגדרת הרשאות
    scope = ['https://spreadsheets.google.com/feeds', 'https://www.googleapis.com/auth/drive']
    
    # טעינת המפתח מתוך ה"סודות" של סטרים-ליט
    creds_dict = st.secrets["gcp_service_account"]
    creds = ServiceAccountCredentials.from_json_keyfile_dict(creds_dict, scope)
    
    # חיבור
    client = gspread.authorize(creds)
    return client.open(SHEET_NAME).sheet1

# --- טעינת נתונים ---
def load_data():
    try:
        sheet = get_google_sheet()
        data = sheet.get_all_records()
        return pd.DataFrame(data)
    except Exception as e:
        return pd.DataFrame() # מחזיר טבלה ריקה במקרה של שגיאה או גיליון ריק

# --- שמירת נתונים ---
def save_data(date, duration, stress, notes):
    sheet = get_google_sheet()
    # המרת התאריך למחרוזת כדי שיישמר יפה
    date_str = date.strftime("%Y-%m-%d")
    sheet.append_row([date_str, duration, stress, notes])

# --- עיצוב האפליקציה ---
st.set_page_config(page_title="היומן של מייפל", page_icon="🐕")
st.title("🐕 המעקב של מייפל")
st.caption("הנתונים נשמרים ב-Google Sheets באופן מאובטח")

# --- טופס הזנה ---
with st.expander("📝 הוסף תרגול חדש", expanded=True):
    col1, col2 = st.columns(2)
    with col1:
        d_date = st.date_input("תאריך", datetime.now())
        d_duration = st.number_input("זמן (דקות)", min_value=1, step=1)
    with col2:
        d_stress = st.slider("רמת לחץ (1-רגועה, 5-פאניקה)", 1, 5, 1)
        d_notes = st.text_area("הערות")

    if st.button("שמור דיווח"):
        try:
            with st.spinner('שומר לגוגל שיטס...'):
                save_data(d_date, d_duration, d_stress, d_notes)
            st.success("הנתונים נשמרו בהצלחה!")
            st.rerun()
        except Exception as e:
            st.error(f"שגיאה בשמירה: {e}")

# --- תצוגה וגרפים ---
st.divider()
df = load_data()

if not df.empty and 'Date' in df.columns:
    # המרת עמודת התאריך לפורמט של תאריך אמיתי לטובת הגרף
    df['Date'] = pd.to_datetime(df['Date'])
    df = df.sort_values(by='Date')

    # מטריקות
    c1, c2, c3 = st.columns(3)
    c1.metric("סה\"כ אימונים", len(df))
    c2.metric("שיא זמן (דקות)", df['Duration'].max())
    if 'Stress' in df.columns:
        last_stress = df['Stress'].iloc[-1]
        c3.metric("סטרס באימון האחרון", last_stress)

    # גרף
    st.subheader("📊 גרף התקדמות")
    fig = px.line(df, x='Date', y='Duration', markers=True, title='משך זמן לבד (דקות)')
    fig.update_traces(line_color='#FFA500')
    st.plotly_chart(fig, use_container_width=True)

    # טבלה
    with st.expander("ראו היסטוריה מלאה"):
        st.dataframe(df.sort_values(by='Date', ascending=False), use_container_width=True)
else:
    st.info("עדיין אין נתונים בגיליון. זה הזמן להוסיף את האימון הראשון!")
