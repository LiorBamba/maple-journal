import streamlit as st
import pandas as pd
import os
from datetime import datetime
import plotly.express as px

# --- הגדרות ---
DATA_FILE = 'maple_training_log.csv'

# פונקציה לטעינת הנתונים
def load_data():
    if os.path.exists(DATA_FILE):
        return pd.read_csv(DATA_FILE)
    else:
        return pd.DataFrame(columns=['Date', 'Duration_Minutes', 'Stress_Level', 'Notes'])

# פונקציה לשמירת נתונים
def save_data(date, duration, stress, notes):
    df = load_data()
    new_data = pd.DataFrame({
        'Date': [date],
        'Duration_Minutes': [duration],
        'Stress_Level': [stress],
        'Notes': [notes]
    })
    df = pd.concat([df, new_data], ignore_index=True)
    df.to_csv(DATA_FILE, index=False)
    return df

# --- עיצוב האפליקציה ---
st.set_page_config(page_title="היומן של מייפל", page_icon="🐕")

st.title("🐕 המעקב של מייפל")
st.markdown("יומן תרגולים לחשיפה הדרגתית והישארות בבית.")

# --- לשונית הזנת נתונים ---
with st.expander("📝 הוסף תרגול חדש", expanded=True):
    col1, col2 = st.columns(2)
    
    with col1:
        d_date = st.date_input("תאריך", datetime.now())
        d_duration = st.number_input("כמה זמן נשארה לבד? (דקות)", min_value=1, step=1)
    
    with col2:
        # סקאלה של 1-5 לסטרס
        d_stress = st.slider(
            "רמת הלחץ של מייפל (1-רגועה לחלוטין, 5-פאניקה)", 
            1, 5, 1
        )
        d_notes = st.text_area("הערות (נבחה? הרסה משהו? הייתה שקטה?)")

    if st.button("שמור תרגול"):
        save_data(d_date, d_duration, d_stress, d_notes)
        st.success("התרגול נשמר בהצלחה! כל הכבוד למייפל.")
        st.rerun()

# --- הצגת נתונים וגרפים ---
st.divider()
df = load_data()

if not df.empty:
    st.subheader("📊 ההתקדמות של מייפל")
    
    # המרת תאריך לפורמט מתאים
    df['Date'] = pd.to_datetime(df['Date'])
    df = df.sort_values(by='Date')

    # מטריקות מהירות
    col_a, col_b, col_c = st.columns(3)
    col_a.metric("סה\"כ תרגולים", len(df))
    col_b.metric("שיא זמן (דקות)", df['Duration_Minutes'].max())
    # ממוצע סטרס ב-3 אימונים אחרונים
    recent_stress = df.tail(3)['Stress_Level'].mean()
    col_c.metric("רמת סטרס (לאחרונה)", f"{recent_stress:.1f}")

    # גרף התקדמות
    fig = px.line(df, x='Date', y='Duration_Minutes', markers=True, title='משך זמן ההישארות לבד (דקות)')
    fig.update_traces(line_color='#FFA500') # צבע כתום למייפל
    st.plotly_chart(fig, use_container_width=True)

    # טבלת נתונים
    st.subheader("היסטוריית אימונים")
    st.dataframe(df.sort_values(by='Date', ascending=False), use_container_width=True)

else:
    st.info("עדיין אין נתונים. התחילו את התרגול הראשון!")

# --- טיפ יומי ---
st.divider()
st.caption("טיפ: אם רמת הלחץ עולה, כדאי לחזור שלב אחד אחורה בזמנים בתרגול הבא.")
