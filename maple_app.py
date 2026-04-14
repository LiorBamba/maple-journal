import streamlit as st
import pandas as pd
import gspread
from oauth2client.service_account import ServiceAccountCredentials
from datetime import datetime
import plotly.express as px
import time 
import pytz # <--- חדש: ספרייה לאזורי זמן

# --- הגדרת שעון ישראל ---
IL_TZ = pytz.timezone('Asia/Jerusalem')
# --- הגדרות דף ---
st.set_page_config(page_title="היומן של מייפל", page_icon="🐕", layout="wide")

# ... (ה-CSS נשאר אותו דבר, אין צורך לשנות) ...
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
    [data-testid="stSlider"] { direction: ltr; }
    .stButton button { width: 100%; }
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
    # מנגנון ניסיון חוזר גם בחיבור לגיליון
    for i in range(3):
        try:
            client = get_client()
            sh = client.open_by_url(SHEET_URL)
            return sh.worksheet(worksheet_name)
        except Exception as e:
            if "429" in str(e):
                time.sleep(2) # חכה 2 שניות ונסה שוב
                continue
            else:
                raise e

# --- פונקציית קריאה חכמה (מונעת קריסות 429) ---
@st.cache_data(ttl=60) # שומר בזיכרון ל-60 שניות כדי לא להציף את גוגל
def get_data(worksheet_name):
    retries = 3
    for n in range(retries):
        try:
            sheet = get_worksheet(worksheet_name)
            all_values = sheet.get_all_values()
            
            if not all_values: return pd.DataFrame()
            
            headers = all_values[0]
            data = all_values[1:]
            return pd.DataFrame(data, columns=headers)
            
        except Exception as e:
            # אם השגיאה היא 429 (Quota exceeded)
            if "429" in str(e):
                if n < retries - 1: # אם נשארו ניסיונות
                    time.sleep(2 ** (n + 1)) # המתנה מדורגת: 2 שניות, 4 שניות...
                    continue
            # אם זו שגיאה אחרת או שנגמרו הניסיונות
            st.error(f"שגיאה בטעינת נתונים (נסה לרענן): {e}")
            return pd.DataFrame()
    return pd.DataFrame()

# --- פונקציית הוספה חכמה ---
def append_row(worksheet_name, row_list):
    try:
        sheet = get_worksheet(worksheet_name)
        sheet.append_row(row_list)
        st.cache_data.clear() # מנקה את הזיכרון כדי שנראה את העדכון
        return True
    except Exception as e:
        if "429" in str(e):
            st.warning("גוגל עמוס, מנסה שוב בעוד רגע...")
            time.sleep(3)
            try:
                sheet.append_row(row_list)
                st.cache_data.clear()
                return True
            except:
                st.error("נכשלנו בשמירה עקב עומס. נסה שוב בעוד דקה.")
                return False
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

def smart_update(worksheet_name, original_df, edited_df):
    """
    פונקציה חכמה שמעדכנת לפי האינדקס המקורי של השורה.
    זה מאפשר לערוך את ה-10 שורות האחרונות בלי לדרוס את ההתחלה.
    """
    try:
        sheet = get_worksheet(worksheet_name)
        
        # 1. בדיקת מחיקה: האם מחקו שורות בטבלה הערוכה?
        # אנו בודקים אילו אינדקסים היו במקור וחסרים עכשיו
        missing_indices = original_df.index.difference(edited_df.index)
        
        if not missing_indices.empty:
            # מחיקה מהסוף להתחלה כדי לא לשבש את המספרים
            for idx in sorted(missing_indices, reverse=True):
                # המרה מאינדקס (מתחיל ב-0) למספר שורה בשיטס (מתחיל ב-2)
                row_num = idx + 2
                sheet.delete_rows(int(row_num))
                st.success(f"שורה {row_num} נמחקה!")
            
            st.cache_data.clear()
            return True

        # 2. בדיקת שינויים: האם התוכן השתנה?
        # אנחנו רצים רק על האינדקסים שקיימים בטבלה שערכנו
        for idx in edited_df.index:
            # אם השורה הזו קיימת במקור, נשווה אותה
            if idx in original_df.index:
                # המרה לטקסט לצורך השוואה
                original_row = original_df.loc[idx].astype(str)
                edited_row = edited_df.loc[idx].astype(str)
                
                if not original_row.equals(edited_row):
                    # נמצא שינוי!
                    row_num = idx + 2  # חישוב השורה האמיתית בגוגל
                    new_values = edited_row.tolist()
                    
                    # עדכון כירורגי של השורה הספציפית
                    sheet.update(range_name=f"A{row_num}", values=[new_values])
                    st.success(f"שורה {row_num} עודכנה!")
                    st.cache_data.clear()
                    return True
            
        st.info("לא זוהו שינויים.")
        return False
        
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
            d_date = st.date_input("תאריך", datetime.now(IL_TZ))
        with c2:
            d_time = st.time_input("שעה", datetime.now(IL_TZ).time())
        with c3:
            # שינוי לדקות -> שעות, כולל פורמט עשרוני
            d_dur = st.number_input("זמן (שעות)", min_value=0.0, step=0.25, format="%.2f")
            
        c4, c5 = st.columns([1, 2])
        with c4:
            d_stress = st.select_slider("לחץ ( 1-רגועה,5-קרעה שמיכה)", options=[1, 2, 3, 4, 5], value=3)
        with c5:
            d_note = st.text_input("הערות")
            
        if st.form_submit_button("שמור 💾"):
            row = [str(d_date), str(d_time), d_dur, d_stress, d_note]
            if append_row("Training", row):
                st.success("נשמר!")
                st.rerun()

    st.divider()
    
    st.subheader("✏️ עריכת היסטוריה (10 אחרונים)")
    
    # 1. טעינת כל הנתונים
    df_all = get_data("Training")
    
    if not df_all.empty:
        # --- שדרוג UI: ניקוי הנתונים לפני התצוגה ---
        # חיתוך המילי-שניות מעמודת השעה (נשאיר רק HH:MM)
        if 'Time' in df_all.columns:
            df_all['Time'] = df_all['Time'].astype(str).apply(lambda x: x[:5] if len(x) > 5 else x)
        
        # המרה למספרים כדי שהעורך ייתן לנו חיצים קטנים לעריכה (Steppers)
        if 'Duration' in df_all.columns:
            df_all['Duration'] = pd.to_numeric(df_all['Duration'], errors='coerce')
        if 'StressLevel' in df_all.columns:
            df_all['StressLevel'] = pd.to_numeric(df_all['StressLevel'], errors='coerce')

        # 2. חיתוך: לוקחים רק את ה-10 האחרונים
        df_tail = df_all.tail(10)

        # 3. שמירת המצב המקורי בזיכרון להשוואה
        if 'train_original' not in st.session_state:
             st.session_state['train_original'] = df_tail.copy()

        # 4. הצגת העורך המעוצב!
        edited_df = st.data_editor(
            df_tail, 
            num_rows="fixed", 
            use_container_width=True, 
            hide_index=True, # מעלים את העמודה של מספרי השורות (7, 8, 9...)
            key="train_editor",
            column_config={
                "Date": st.column_config.Column("📅 תאריך"),
                "Time": st.column_config.Column("⏰ שעה"),
                "Duration": st.column_config.NumberColumn("⏳ זמן (שעות)", format="%.2f", min_value=0.0, step=0.25),
                "StressLevel": st.column_config.NumberColumn("😰 מדד לחץ", min_value=1, max_value=5, step=1),
                "Notes": st.column_config.TextColumn("📝 הערות")
            }
        )
        
        if st.button("שמור שינויים בטבלה 💾", key="save_tail_btn"):
            if smart_update("Training", st.session_state['train_original'], edited_df):
                del st.session_state['train_original']
                st.rerun()

        # --- הגרף המאוחד: עצימות משוקללת, מגמה ונקודות ---
        st.divider()
        if 'Date' in df_all.columns and 'Duration' in df_all.columns:
            import plotly.graph_objects as go
            
            df_chart = df_all.copy()
            # מציאת עמודת הלחץ (בדרך כלל הרביעית)
            stress_col = df_all.columns[3] if len(df_all.columns) >= 4 else 'StressLevel'
            
            df_chart['Date'] = pd.to_datetime(df_chart['Date'], errors='coerce')
            df_chart['Duration'] = pd.to_numeric(df_chart['Duration'], errors='coerce')
            df_chart['StressLevel'] = pd.to_numeric(df_chart[stress_col], errors='coerce').fillna(3)
            df_chart = df_chart.dropna(subset=['Date', 'Duration']).sort_values('Date')
            
            # --- חישוב מדד עצימות משוקלל ---
            df_chart['Weighted_Duration'] = df_chart['Duration'] * (df_chart['StressLevel'] / 3.0)
            
            daily = df_chart.groupby('Date')['Weighted_Duration'].sum().reset_index()
            daily.set_index('Date', inplace=True)
            daily = daily.resample('D').sum().fillna(0)
            
            def calculate_intensity(window):
                length = len(window)
                weights = [0.5**(length - 1 - i) for i in range(length)]
                return sum(w * val for w, val in zip(weights, window))
            
            daily['Intensity'] = daily['Weighted_Duration'].rolling(window=7, min_periods=1).apply(calculate_intensity)
            daily = daily.reset_index()

            # --- חישוב טווחי עצימות מעודכנים ---
            q33 = daily['Intensity'].quantile(0.33) # שליש תחתון
            q90 = daily['Intensity'].quantile(0.90) # עשירון עליון
            max_val = daily['Intensity'].max()
            top_bound = max_val * 1.1 if max_val > 0 else 1

            # --- בניית הגרף המאוחד ---
            fig = go.Figure()

            # רקעי צבע (Zones) - הפעם בשקיפות גבוהה מאוד כדי שהפוקוס יהיה על הקו
            fig.add_hrect(y0=0, y1=q33, line_width=0, fillcolor="#2196F3", opacity=0.08, 
                          annotation_text="🔵 שימור / עומס נמוך", annotation_position="top left")
            fig.add_hrect(y0=q33, y1=q90, line_width=0, fillcolor="#4CAF50", opacity=0.08, 
                          annotation_text="🟢 טווח עבודה אידיאלי", annotation_position="top left")
            fig.add_hrect(y0=q90, y1=top_bound, line_width=0, fillcolor="#F44336", opacity=0.08, 
                          annotation_text="🔴 עצימות גבוהה", annotation_position="top left")

            # 1. שכבת העצימות - קו מחליף צבע עם שטח מילוי
            # המילוי (fill) צבוע באפור נייטרלי כדי לא להתנגש עם צבע הקו המשתנה
            fig.add_trace(go.Scatter(
                x=daily['Date'], y=daily['Intensity'],
                fill='tozeroy',
                fillcolor='rgba(200, 200, 200, 0.1)',
                mode='lines+markers',
                name='עצימות משוקללת',
                # הקו עצמו מחליף צבע על ידי שימוש ב-marker color scale
                line=dict(width=4, shape='spline', color='#888888'), 
                marker=dict(
                    size=8,
                    color=daily['Intensity'],
                    colorscale=[[0, "#2196F3"], [0.33, "#4CAF50"], [0.9, "#F44336"], [1, "#B71C1C"]],
                    cmin=0, cmax=max_val,
                    line=dict(width=1, color='white')
                ),
                hovertemplate="עומס מורגש: %{y:.2f}<extra></extra>"
            ))

            # 2. קו מגמה (רק אימונים משמעותיים)
            df_line = df_chart[(df_chart['Duration'] > 0.5) | (df_chart['StressLevel'] >= 4)]
            fig.add_trace(go.Scatter(
                x=df_line['Date'], y=df_line['Duration'],
                mode='lines',
                name='מגמת שיא',
                line=dict(color='rgba(100, 100, 100, 0.4)', width=2, dash='dot'),
                hovertemplate="מגמה: %{y} שעות<extra></extra>"
            ))

            # 3. נקודות האימון (צבע לפי לחץ)
            fig.add_trace(go.Scatter(
                x=df_chart['Date'], y=df_chart['Duration'],
                mode='markers',
                name='אימונים בודדים',
                marker=dict(
                    size=10,
                    color=df_chart['StressLevel'],
                    colorscale=[[0, "#4CAF50"], [0.5, "#FFC107"], [1.0, "#FF5252"]],
                    cmin=1, cmax=5,
                    line=dict(width=1, color='white')
                ),
                customdata=df_chart['StressLevel'],
                hovertemplate="<b>זמן:</b> %{y} שעות<br><b>לחץ:</b> %{customdata}<extra></extra>"
            ))

            # עיצוב סופי
            fig.update_layout(
                title="🐕 ניתוח עומס והתקדמות של מייפל",
                yaxis_title="שעות משוקללות / זמן",
                hovermode="x unified",
                legend=dict(orientation="h", yanchor="bottom", y=1.02, xanchor="right", x=1),
                margin=dict(l=0, r=0, t=60, b=0),
                height=500
            )
            fig.update_xaxes(dtick="D1", tickformat="%d/%m")
            
            st.plotly_chart(fig, use_container_width=True)
            
            st.link_button("פתח את הגיליון המלא בגוגל שיטס 📊", SHEET_URL, use_container_width=True)

        else:
            st.info("אין מספיק נתונים להצגת הגרף המאוחד.")

# --- טאב 2: האכלות (Feeding) - גרסה עם גרף צבעוני ---
with tab2:
    st.header("יומן אכילה")
    
    # --- חלק א: הוספה חדשה ---
    with st.form("food_form", clear_on_submit=True):
        st.subheader("🍖 הוספת ארוחה")
        c1, c2 = st.columns(2)
        with c1:
            f_date = st.date_input("תאריך", datetime.now(IL_TZ))
            f_time = st.time_input("שעה", datetime.now(IL_TZ).time())
            f_type = st.selectbox("סוג ארוחה", ["בוקר", "ערב", "אחר"])
        with c2:
            f_am = st.number_input("כמות (כוסות)", value=1.0, step=0.25, format="%.2f", help="1 כוס = 400 גרם")
            f_fin = st.checkbox("האם סיימה הכל?", value=True)
            f_note = st.text_input("הערות נוספות")
            
        submitted_food = st.form_submit_button("שמור ארוחה 💾")
        if submitted_food:
            fin_str = "כן" if f_fin else "לא"
            time_str = f_time.strftime("%H:%M") 
            row = [str(f_date), time_str, f_type, f_am, fin_str, f_note]
            
            if append_row("Feeding", row):
                st.success("הארוחה נשמרה!")
                st.rerun()

    st.divider()

    # --- חלק ב: עריכה חכמה (10 אחרונים) ---
    st.subheader("✏️ עריכת היסטוריית האכלות (10 אחרונים)")
    
    df_food = get_data("Feeding")
    
    if not df_food.empty:
        # ניקוי נתונים
        if 'Date' in df_food.columns:
            df_food['Date'] = pd.to_datetime(df_food['Date'], errors='coerce').dt.strftime('%Y-%m-%d')
        if 'Time' in df_food.columns:
            df_food['Time'] = df_food['Time'].astype(str).apply(lambda x: x[:5] if len(x) > 5 else x)

        # חיתוך ל-10 אחרונים ועורך
        df_tail = df_food.tail(10)

        if 'feed_original' not in st.session_state:
            st.session_state['feed_original'] = df_tail.copy()

        edited_feed = st.data_editor(
            df_tail, 
            num_rows="fixed", 
            use_container_width=True, 
            key="feed_editor",
            column_config={
                "Amount": st.column_config.NumberColumn("כמות (כוסות)", format="%.2f"),
                "Finished": st.column_config.CheckboxColumn("סיימה?", default=True),
            }
        )
        
        if st.button("שמור שינויים בטבלה 💾", key="save_feed_btn"):
            if smart_update("Feeding", st.session_state['feed_original'], edited_feed):
                del st.session_state['feed_original']
                st.success("הטבלה עודכנה!")
                st.rerun()

        # --- חלק ג: הגרף הצבעוני ---
        st.divider()
        if 'Amount' in df_food.columns and 'Finished' in df_food.columns:
            df_chart = df_food.copy()
            df_chart['Date'] = pd.to_datetime(df_chart['Date'], errors='coerce')
            df_chart['Amount'] = pd.to_numeric(df_chart['Amount'], errors='coerce').fillna(0)
            
            # קיבוץ גם לפי תאריך וגם לפי "האם סיימה" (כדי לפצל צבעים)
            daily = df_chart.groupby(['Date', 'Finished'])['Amount'].sum().reset_index()
            
            st.caption("📊 כמות אוכל יומית (כוסות):")
            
            # יצירת גרף עם צבעים מותאמים אישית
            fig = px.bar(daily, x='Date', y='Amount', color='Finished',
                         title="מעקב אכילה (ירוק=סיימה, אדום=לא סיימה)",
                         # כאן המג'יק קורה: מיפוי צבעים
                         color_discrete_map={
                             "כן": "#4CAF50",  # ירוק
                             "לא": "#FF5252"   # אדום בוהק
                         },
                         labels={'Date': 'תאריך', 'Amount': 'כמות', 'Finished': 'סיימה?'})
            
            fig.update_xaxes(dtick="D1", tickformat="%d/%m")
            st.plotly_chart(fig, use_container_width=True)
            
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
                l_date = st.date_input("תאריך ביצוע", datetime.now(IL_TZ))
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







