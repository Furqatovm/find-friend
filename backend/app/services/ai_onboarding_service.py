import re

class AIOnboardingService:
    @staticmethod
    def process_step(step: int, user_message: str, current_state: dict, user_name: str = 'Friend') -> dict:
        """
        Processes conversational input at each stage of onboarding,
        extracts structured tags (supporting English, Uzbek, and Russian),
        and returns the next prompt + suggestion chips.
        """
        msg = (user_message or '').lower().strip()
        updated_state = dict(current_state or {})

        # Ensure keys exist
        if 'interests' not in updated_state: updated_state['interests'] = []
        if 'goals' not in updated_state: updated_state['goals'] = []
        if 'skills' not in updated_state: updated_state['skills'] = []
        if 'availabilities' not in updated_state: updated_state['availabilities'] = []
        if 'activity_mode' not in updated_state: updated_state['activity_mode'] = 'both'
        if 'preferred_group_size' not in updated_state: updated_state['preferred_group_size'] = 'small_group'
        if 'city' not in updated_state: updated_state['city'] = 'Tashkent'
        if 'headline' not in updated_state: updated_state['headline'] = ''
        if 'bio' not in updated_state: updated_state['bio'] = ''

        # Step 1: Interests & Directions
        if step == 1:
            detected_interests = []
            # Keyword matching for diverse languages
            keywords = {
                "Programming": ["dasturlash", "kod", "coding", "programming", "developer", "software", "программирование", "разработка"],
                "Artificial Intelligence": ["ai", "sun'iy intellekt", "machine learning", "ml", "ии", "нейросети", "artificial intelligence"],
                "SAT Prep": ["sat", "sat math", "sat reading", "digital sat", "колледж", "imtihon"],
                "IELTS Speaking": ["ielts", "ielts speaking", "english", "ingliz tili", "английский", "speaking"],
                "Game Development": ["game dev", "o'yin yaratish", "unity", "unreal", "gamedev", "игры", "геймдев"],
                "Startups & Venture": ["startup", "biznes", "startap", "founder", "стартап", "бизнес"],
                "UI/UX Design": ["dizayn", "design", "figma", "ui/ux", "дизайн", "ux"],
                "Football & Soccer": ["futbol", "football", "soccer", "спорт", "футбол"],
                "Music Production": ["musiqa", "music", "guitar", "production", "музыка", "гитара"],
                "Reading & Literature": ["kitob", "reading", "adabiyot", "books", "книги", "чтение"],
                "3D Modeling & Blender": ["blender", "3d", "3d modeling", "анимация", "моделирование"]
            }

            for interest_name, kw_list in keywords.items():
                if any(kw in msg for kw in kw_list):
                    if interest_name not in updated_state['interests']:
                        detected_interests.append(interest_name)

            # If user selected or typed custom chips
            if not detected_interests and user_message:
                detected_interests.append(user_message.strip().title())

            for di in detected_interests:
                if di not in updated_state['interests']:
                    updated_state['interests'].append(di)

            interest_list_str = ", ".join(updated_state['interests']) if updated_state['interests'] else "your interests"
            
            reply = f"Ajoyib! Sizning qiziqishlaringiz saqlandi ({interest_list_str}). 🎉\n\nEndi 2-qadam: Aynan nimalarga tayyorlanyapsiz yoki asosiy maqsadlaringiz nimalardan iborat? (Masalan: SAT dan 800 olish, IELTS Speaking 8.0, AI startup qurish, Python o'rganish)"
            
            suggested_chips = [
                "SAT Math 800 ball olish",
                "IELTS Speaking 8.0 darajasiga chiqish",
                "AI SaaS MVP qurish",
                "Python & Backend o'rganish",
                "Indie Game loyihasini chiqarish",
                "Ingliz tilida erkin gaplashish",
                "Hackathon uchun jamoa topish"
            ]
            next_step = 2

        # Step 2: Goals & Targets
        elif step == 2:
            detected_goals = []
            goal_keywords = {
                "Prepare for SAT Math 800": ["sat", "sat 800", "sat math", "800 ball"],
                "Score 8.0 on IELTS Speaking": ["ielts", "ielts 8", "speaking 8", "8.0"],
                "Build AI SaaS MVP": ["ai saas", "saas", "startup", "mvp", "ai startup"],
                "Learn React & TypeScript": ["react", "typescript", "frontend", "ts"],
                "Practice Conversational English": ["english", "ingliz tili", "gaplashish", "speaking practice"],
                "Launch Indie 2D Game": ["game", "indie", "unity", "o'yin"],
                "Find Hackathon Teammates": ["hackathon", "xakaton", "jamoa", "teammate"],
                "Play Weekend Football": ["futbol", "football", "match"],
                "Learn Machine Learning & PyTorch": ["machine learning", "pytorch", "ml"]
            }

            for goal_title, kw_list in goal_keywords.items():
                if any(kw in msg for kw in kw_list):
                    if goal_title not in updated_state['goals']:
                        detected_goals.append(goal_title)

            if not detected_goals and user_message:
                detected_goals.append(user_message.strip())

            for dg in detected_goals:
                if dg not in updated_state['goals']:
                    updated_state['goals'].append(dg)

            goals_str = ", ".join(updated_state['goals']) if updated_state['goals'] else "maqsadlaringiz"
            
            reply = f"Juda yaxshi! Maqsadlaringiz aniqlandi ({goals_str}). 🚀\n\n3-qadam: Hozirda qanday ko'nikmalaringiz (skills) bor va ularning darajasi qanday? (Masalan: Python Intermediate, React Beginner, SAT Math Advanced)"
            
            suggested_chips = [
                "Python (Intermediate)",
                "React (Beginner)",
                "SAT Math (Advanced)",
                "IELTS Speaking (Intermediate)",
                "Figma & UI/UX (Intermediate)",
                "Unity & C# (Beginner)",
                "Public Speaking (Intermediate)"
            ]
            next_step = 3

        # Step 3: Skills & Proficiency Levels
        elif step == 3:
            # Parse skill + level from text or chips
            skill_input = user_message.strip()
            level = "Intermediate"
            if "beginner" in msg or "boshlang'ich" in msg:
                level = "Beginner"
            elif "advanced" in msg or "yuqori" in msg or "kuchli" in msg:
                level = "Advanced"

            # Clean name
            skill_name = re.sub(r'\(.*?\)', '', skill_input).strip()
            if skill_name:
                updated_state['skills'].append({
                    'name': skill_name,
                    'level': level
                })

            reply = f"Ko'nikmangiz saqlandi ({skill_name} - {level})! 💪\n\n4-qadam: Qanday formatda birga ishlashni/o'rganishni afzal ko'rasiz (Online, In-Person yoki Har ikkalasi) va qanday jamoa hajmi qulay?"
            
            suggested_chips = [
                "🌐 Online (Discord / Zoom)",
                "📍 In-person (Kutubxona / Cafe)",
                "⚡ Har ikkalasi (Both)",
                "1-on-1 (Yakkama-yakka)",
                "Kichik jamoa (3-5 kishi)"
            ]
            next_step = 4

        # Step 4: Collaboration Style & Format
        elif step == 4:
            if "online" in msg:
                updated_state['activity_mode'] = 'online'
            elif "in-person" in msg or "in person" in msg or "offline" in msg:
                updated_state['activity_mode'] = 'in_person'
            else:
                updated_state['activity_mode'] = 'both'

            if "1-on-1" in msg or "yakka" in msg:
                updated_state['preferred_group_size'] = '1-on-1'
            elif "katta" in msg or "large" in msg:
                updated_state['preferred_group_size'] = 'large_group'
            else:
                updated_state['preferred_group_size'] = 'small_group'

            reply = f"Format saqlandi ({updated_state['activity_mode']} format, {updated_state['preferred_group_size']}). 🎯\n\n5-qadam: Qaysi kunlari va qaysi vaqtlarda asosan bo'shsiz? Qaysi shaharda yashaysiz?"
            
            suggested_chips = [
                "Shanba va Yakshanba (Dam olish kunlari)",
                "Ish kunlari kechqurun (18:00 - 22:00)",
                "Har kuni ertalab (08:00 - 12:00)",
                "Toshkent shahri",
                "Samarqand shahri"
            ]
            next_step = 5

        # Step 5: Availability & Location -> Profile Generator
        elif step >= 5:
            # Parse days / slots
            if "shanba" in msg or "weekend" in msg or "yakshanba" in msg or "dam olish" in msg:
                updated_state['availabilities'].append({'day_of_week': 'Saturday', 'time_slot': 'Afternoon (12:00-18:00)'})
                updated_state['availabilities'].append({'day_of_week': 'Sunday', 'time_slot': 'Morning (08:00-12:00)'})
            else:
                updated_state['availabilities'].append({'day_of_week': 'Weekday', 'time_slot': 'Evening (18:00-22:00)'})

            # Check city
            for city_candidate in ["Tashkent", "Toshkent", "Samarkand", "Samarqand", "Bukhara", "Buxoro", "Fergana", "London", "New York"]:
                if city_candidate.lower() in msg:
                    updated_state['city'] = city_candidate.capitalize()
                    break

            # Auto-generate tailored headline & bio from extracted preferences
            primary_goal = updated_state['goals'][0] if updated_state['goals'] else "Studying & Building"
            primary_skill = updated_state['skills'][0]['name'] if updated_state['skills'] else "Eager Learner"
            
            updated_state['headline'] = f"{primary_skill} · Goal: {primary_goal}"
            updated_state['bio'] = f"Focused on {primary_goal}. Looking for like-minded partners to collaborate, stay accountable, and share progress together!"
            updated_state['looking_for_summary'] = f"Partners for {primary_goal}"

            reply = f"Ajoyib, {user_name}! Barcha ma'lumotlaringiz asosida mukammal profilingiz yaratildi. Sizga mos sheriklarni topishga tayyormisiz? 🌟"
            
            suggested_chips = [
                "Ha, mos odamlarni ko'rsat! 🚀",
                "Profilni tasdiqlash va boshlash"
            ]
            next_step = 6

        return {
            'step': next_step,
            'reply': reply,
            'suggested_chips': suggested_chips,
            'extracted_state': updated_state
        }
