import random
from app import create_app
from app.models.user import db, User
from app.models.profile import Profile, LocationPreference
from app.models.taxonomy import Interest, UserInterest, Skill, UserSkill, Goal, UserGoal, Availability
from app.models.connection import Connection
from app.models.message import Conversation, Message
from app.models.activity import Activity, ActivityParticipant
from app.models.project import Project, ProjectMember
from app.models.group import Group, GroupMember, GroupMessage
from app.models.notification_and_safety import Notification, ContactShare
from app.models.follow import Follow
from app.utils.location_utils import fuzz_coordinates

app = create_app()

def seed_database():
    with app.app_context():
        print("Clearing old data...")
        try:
            db.session.execute(db.text("DROP SCHEMA public CASCADE; CREATE SCHEMA public;"))
            db.session.commit()
        except Exception:
            db.session.rollback()
            db.drop_all()
        db.create_all()

        print("Seeding Taxonomies...")
        # 1. Interests
        interest_defs = [
            ("Programming", "Coding", "code"),
            ("Artificial Intelligence", "Coding", "sparkles"),
            ("SAT Prep", "Study", "book-open"),
            ("IELTS Speaking", "Languages", "message-circle"),
            ("Game Development", "Gaming", "gamepad-2"),
            ("Startups & Venture", "Startups", "rocket"),
            ("Reading & Literature", "Reading", "book"),
            ("Football & Soccer", "Sports", "trophy"),
            ("UI/UX Design", "Creative", "palette"),
            ("Music Production", "Music", "music"),
            ("Chess", "Gaming", "crown"),
            ("Photography", "Creative", "camera"),
            ("French Language", "Languages", "globe"),
            ("3D Modeling & Blender", "Creative", "box"),
            ("Science & Physics", "Study", "atom"),
            ("Fitness & Gym", "Sports", "activity"),
            ("Creative Writing", "Creative", "feather"),
            ("Minecraft", "Gaming", "box"),
            ("Data Science", "Coding", "bar-chart-2"),
            ("Philosophy", "Reading", "brain")
        ]
        interest_map = {}
        for name, cat, icon in interest_defs:
            i = Interest(name=name, category=cat, icon=icon)
            db.session.add(i)
            interest_map[name] = i

        # 2. Skills
        skill_defs = [
            ("React", "Development"),
            ("Python", "Development"),
            ("TypeScript", "Development"),
            ("Figma", "Design"),
            ("PyTorch", "AI / ML"),
            ("Unity", "Game Dev"),
            ("C#", "Game Dev"),
            ("SQL", "Database"),
            ("SAT Math", "Academics"),
            ("IELTS Speaking", "Languages"),
            ("Flutter", "Mobile"),
            ("Blender", "3D & Art"),
            ("Guitar", "Music"),
            ("Product Design", "Design"),
            ("Node.js", "Development"),
            ("Next.js", "Development"),
            ("Marketing", "Business"),
            ("Public Speaking", "Soft Skills"),
            ("Data Analysis", "Analytics"),
            ("Prompt Engineering", "AI / ML")
        ]
        skill_map = {}
        for name, cat in skill_defs:
            s = Skill(name=name, category=cat)
            db.session.add(s)
            skill_map[name] = s

        # 3. Goals
        goal_defs = [
            ("Prepare for SAT Math 800", "Study", "graduation-cap"),
            ("Score 8.0 on IELTS Speaking", "Languages", "mic"),
            ("Build AI SaaS MVP", "Startups", "rocket"),
            ("Launch Indie 2D Game", "Gaming", "gamepad"),
            ("Learn React & TypeScript", "Coding", "laptop"),
            ("Practice Conversational English", "Languages", "message-square"),
            ("Find Hackathon Teammates", "Coding", "users"),
            ("Weekly Sci-Fi Book Club", "Reading", "book"),
            ("Play Weekend Football", "Sports", "shield"),
            ("Build Open Source Projects", "Coding", "git-branch"),
            ("Learn Machine Learning & PyTorch", "Coding", "cpu"),
            ("Find Co-founder for EdTech", "Startups", "briefcase"),
            ("Daily Coding Accountability", "Coding", "check-circle"),
            ("Master 3D Modeling in Blender", "Creative", "layers"),
            ("Learn French Together", "Languages", "globe")
        ]
        goal_map = {}
        for title, cat, icon in goal_defs:
            g = Goal(title=title, category=cat, icon=icon)
            db.session.add(g)
            goal_map[title] = g

        db.session.commit()
        print("Taxonomies committed.")

        users_data = [
            {
                "username": "admin",
                "email": "admin@withme.com",
                "password": "admin123",
                "is_admin": True,
                "display_name": "Super Administrator",
                "headline": "Platform Director & System Administrator 🛡️",
                "bio": "Lead administrator for WithMe. Ensuring platform safety, community growth, and verified study/project partnerships.",
                "avatar_url": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80",
                "city": "Tashkent",
                "country": "Uzbekistan",
                "lat": 41.3110,
                "lon": 69.2405,
                "activity_mode": "both",
                "group_size": "any",
                "looking_for": "Community leaders, study mentors, and builders",
                "telegram": "@withme_admin",
                "interests": ["Programming", "Startups & Venture", "Artificial Intelligence", "UI/UX Design"],
                "skills": [("Product Design", "Advanced"), ("Python", "Advanced"), ("React", "Advanced")],
                "goals": ["Build AI SaaS MVP", "Find Hackathon Teammates"],
                "avail": [("Saturday", "Morning (08:00-12:00)"), ("Sunday", "Afternoon (12:00-18:00)")]
            },
            {
                "username": "alex_chen",
                "email": "alex@withme.app",
                "password": "password123",
                "display_name": "Alex Chen",
                "headline": "Frontend Engineer & Indie Hacker 🚀",
                "bio": "Building delightful web apps. Looking for a Python/ML dev to co-build AI productivity tools. Love discussing UI, React 19, and indie startups.",
                "avatar_url": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80",
                "city": "Tashkent",
                "country": "Uzbekistan",
                "lat": 41.2995,
                "lon": 69.2401,
                "activity_mode": "both",
                "group_size": "small_group",
                "looking_for": "AI / Backend co-founder & React peers",
                "telegram": "@alexchen_dev",
                "discord": "alexchen#1024",
                "github": "alexchen-dev",
                "interests": ["Programming", "Artificial Intelligence", "Startups & Venture", "UI/UX Design"],
                "skills": [("React", "Advanced"), ("TypeScript", "Advanced"), ("Next.js", "Advanced"), ("Figma", "Intermediate")],
                "goals": ["Build AI SaaS MVP", "Find Hackathon Teammates", "Daily Coding Accountability"],
                "avail": [("Saturday", "Afternoon (12:00-18:00)"), ("Sunday", "Morning (08:00-12:00)"), ("Wednesday", "Evening (18:00-22:00)")]
            },
            {
                "username": "sarah_kim",
                "email": "sarah@withme.app",
                "password": "password123",
                "display_name": "Sarah Kim",
                "headline": "High School Senior · SAT Math Prep 📚",
                "bio": "Aiming for an 800 on SAT Math this Fall! Want an accountability partner to solve 30 hard geometry & algebra problems together every weekend on Discord or cafe.",
                "avatar_url": "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&auto=format&fit=crop&q=80",
                "city": "Tashkent",
                "country": "Uzbekistan",
                "lat": 41.3110,
                "lon": 69.2797,
                "activity_mode": "both",
                "group_size": "1-on-1",
                "looking_for": "SAT study partner & problem solving buddy",
                "telegram": "@sarahk_sat",
                "discord": "sarahk#2048",
                "interests": ["SAT Prep", "Science & Physics", "Reading & Literature", "Chess"],
                "skills": [("SAT Math", "Advanced"), ("Public Speaking", "Intermediate")],
                "goals": ["Prepare for SAT Math 800", "Weekly Sci-Fi Book Club"],
                "avail": [("Saturday", "Morning (08:00-12:00)"), ("Sunday", "Afternoon (12:00-18:00)"), ("Tuesday", "Evening (18:00-22:00)")]
            },
            {
                "username": "marcus_v",
                "email": "marcus@withme.app",
                "password": "password123",
                "display_name": "Marcus Vance",
                "headline": "Indie Game Developer & Pixel Artist 🎮",
                "bio": "Developing a 2D roguelike deckbuilder in Unity. Need a C# programmer or sound designer to collaborate and test mechanics together!",
                "avatar_url": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80",
                "city": "Tashkent",
                "country": "Uzbekistan",
                "lat": 41.3275,
                "lon": 69.2817,
                "activity_mode": "online",
                "group_size": "small_group",
                "looking_for": "C# Unity devs & chiptune sound designers",
                "discord": "marcusgame#9911",
                "github": "marcusv-games",
                "interests": ["Game Development", "Programming", "Music Production", "Minecraft"],
                "skills": [("Unity", "Advanced"), ("C#", "Intermediate"), ("Blender", "Intermediate")],
                "goals": ["Launch Indie 2D Game", "Find Hackathon Teammates"],
                "avail": [("Friday", "Evening (18:00-22:00)"), ("Saturday", "Night (22:00+)"), ("Sunday", "Evening (18:00-22:00)")]
            },
            {
                "username": "elena_rostova",
                "email": "elena@withme.app",
                "password": "password123",
                "display_name": "Elena Rostova",
                "headline": "IELTS 8.5 aspirant & Bookworm 📖",
                "bio": "Preparing for IELTS Speaking test. Looking for friendly conversation partners to practice topic cues, idiom fluency, and debate global affairs.",
                "avatar_url": "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&auto=format&fit=crop&q=80",
                "city": "Tashkent",
                "country": "Uzbekistan",
                "lat": 41.3050,
                "lon": 69.2310,
                "activity_mode": "both",
                "group_size": "small_group",
                "looking_for": "English conversation practice & book club members",
                "telegram": "@elena_ielts",
                "interests": ["IELTS Speaking", "Reading & Literature", "Creative Writing", "French Language"],
                "skills": [("IELTS Speaking", "Advanced"), ("Public Speaking", "Advanced")],
                "goals": ["Score 8.0 on IELTS Speaking", "Practice Conversational English", "Weekly Sci-Fi Book Club"],
                "avail": [("Monday", "Evening (18:00-22:00)"), ("Thursday", "Evening (18:00-22:00)"), ("Saturday", "Afternoon (12:00-18:00)")]
            },
            {
                "username": "david_park",
                "email": "david@withme.app",
                "password": "password123",
                "display_name": "David Park",
                "headline": "AI & PyTorch Researcher 🧠",
                "bio": "Master's student working on LLM fine-tuning and retrieval pipelines. Seeking frontend builders to create open-source interactive research demos.",
                "avatar_url": "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop&q=80",
                "city": "Tashkent",
                "country": "Uzbekistan",
                "lat": 41.2850,
                "lon": 69.2050,
                "activity_mode": "both",
                "group_size": "any",
                "looking_for": "Fullstack devs & AI study buddies",
                "telegram": "@davidpark_ai",
                "github": "davidpark-ml",
                "interests": ["Artificial Intelligence", "Programming", "Data Science", "Science & Physics"],
                "skills": [("Python", "Advanced"), ("PyTorch", "Advanced"), ("Data Analysis", "Advanced"), ("Prompt Engineering", "Advanced")],
                "goals": ["Build AI SaaS MVP", "Learn Machine Learning & PyTorch", "Build Open Source Projects"],
                "avail": [("Tuesday", "Evening (18:00-22:00)"), ("Thursday", "Evening (18:00-22:00)"), ("Sunday", "Afternoon (12:00-18:00)")]
            },
            {
                "username": "sofia_martinez",
                "email": "sofia@withme.app",
                "password": "password123",
                "display_name": "Sofia Martinez",
                "headline": "UI/UX & Product Designer 🎨",
                "bio": "Passionate about creating clean design systems and mobile apps. Want to team up with engineers on side-projects and hackathons.",
                "avatar_url": "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&auto=format&fit=crop&q=80",
                "city": "Tashkent",
                "country": "Uzbekistan",
                "lat": 41.3180,
                "lon": 69.2600,
                "activity_mode": "both",
                "group_size": "small_group",
                "looking_for": "Developers building creative tools or mobile apps",
                "telegram": "@sofia_design",
                "interests": ["UI/UX Design", "Startups & Venture", "3D Modeling & Blender", "Photography"],
                "skills": [("Figma", "Advanced"), ("Product Design", "Advanced"), ("Blender", "Beginner")],
                "goals": ["Build AI SaaS MVP", "Find Hackathon Teammates", "Master 3D Modeling in Blender"],
                "avail": [("Monday", "Evening (18:00-22:00)"), ("Wednesday", "Evening (18:00-22:00)"), ("Saturday", "Morning (08:00-12:00)")]
            },
            {
                "username": "jamshid_alimov",
                "email": "jamshid@withme.app",
                "password": "password123",
                "display_name": "Jamshid Alimov",
                "headline": "Full-Stack Dev & Football Enthusiast ⚽",
                "bio": "Node.js & Python backend developer. Also organizing weekly 5v5 football matches on Sundays. Always open to coffee and tech talks!",
                "avatar_url": "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=400&auto=format&fit=crop&q=80",
                "city": "Tashkent",
                "country": "Uzbekistan",
                "lat": 41.3400,
                "lon": 69.2900,
                "activity_mode": "in_person",
                "group_size": "large_group",
                "looking_for": "Football players & backend collaboration",
                "telegram": "@jamshid_code",
                "interests": ["Football & Soccer", "Programming", "Fitness & Gym", "Startups & Venture"],
                "skills": [("Python", "Advanced"), ("Node.js", "Advanced"), ("SQL", "Advanced")],
                "goals": ["Play Weekend Football", "Build Open Source Projects", "Find Co-founder for EdTech"],
                "avail": [("Sunday", "Morning (08:00-12:00)"), ("Wednesday", "Evening (18:00-22:00)"), ("Saturday", "Evening (18:00-22:00)")]
            },
            {
                "username": "clara_dubois",
                "email": "clara@withme.app",
                "password": "password123",
                "display_name": "Clara Dubois",
                "headline": "French & English Exchange | Guitarist 🎵",
                "bio": "Native French speaker living in Central Asia. Looking for native English speakers or language enthusiasts to practice while teaching French!",
                "avatar_url": "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=400&auto=format&fit=crop&q=80",
                "city": "Tashkent",
                "country": "Uzbekistan",
                "lat": 41.3000,
                "lon": 69.2550,
                "activity_mode": "both",
                "group_size": "1-on-1",
                "looking_for": "Language exchange partner & acoustic jam friends",
                "telegram": "@clara_french",
                "interests": ["French Language", "Music Production", "IELTS Speaking", "Philosophy"],
                "skills": [("Guitar", "Advanced"), ("Public Speaking", "Intermediate")],
                "goals": ["Learn French Together", "Practice Conversational English"],
                "avail": [("Tuesday", "Afternoon (12:00-18:00)"), ("Thursday", "Afternoon (12:00-18:00)"), ("Saturday", "Afternoon (12:00-18:00)")]
            },
            {
                "username": "timur_saidov",
                "email": "timur@withme.app",
                "password": "password123",
                "display_name": "Timur Saidov",
                "headline": "Mobile Engineer & Flutter Dev 📱",
                "bio": "Building cross-platform apps for local businesses. Looking for designers and React/Flutter friends for weekend hackathons.",
                "avatar_url": "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&auto=format&fit=crop&q=80",
                "city": "Tashkent",
                "country": "Uzbekistan",
                "lat": 41.3150,
                "lon": 69.2200,
                "activity_mode": "both",
                "group_size": "small_group",
                "looking_for": "Designers and co-developers",
                "telegram": "@timur_flutter",
                "interests": ["Programming", "UI/UX Design", "Startups & Venture", "Chess"],
                "skills": [("Flutter", "Advanced"), ("TypeScript", "Intermediate"), ("Figma", "Intermediate")],
                "goals": ["Build AI SaaS MVP", "Find Hackathon Teammates"],
                "avail": [("Saturday", "Morning (08:00-12:00)"), ("Sunday", "Afternoon (12:00-18:00)")]
            },
            {
                "username": "olivia_wong",
                "email": "olivia@withme.app",
                "password": "password123",
                "display_name": "Olivia Wong",
                "headline": "3D Artist & VR Explorer 👓",
                "bio": "Obsessed with stylized low-poly environments and Blender animations. Want to team up with Unity/Unreal programmers to build immersive worlds.",
                "avatar_url": "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400&auto=format&fit=crop&q=80",
                "city": "Tashkent",
                "country": "Uzbekistan",
                "lat": 41.3300,
                "lon": 69.2700,
                "activity_mode": "online",
                "group_size": "small_group",
                "looking_for": "Game developers & 3D hobbyists",
                "discord": "olivia_3d#5522",
                "interests": ["3D Modeling & Blender", "Game Development", "Creative Writing", "Minecraft"],
                "skills": [("Blender", "Advanced"), ("Unity", "Beginner")],
                "goals": ["Master 3D Modeling in Blender", "Launch Indie 2D Game"],
                "avail": [("Friday", "Evening (18:00-22:00)"), ("Saturday", "Evening (18:00-22:00)")]
            },
            {
                "username": "lucas_muller",
                "email": "lucas@withme.app",
                "password": "password123",
                "display_name": "Lucas Müller",
                "headline": "EdTech Founder & SAT Tutor 🎓",
                "bio": "Working on peer-to-peer study systems. Looking for passionate educators and developers to test new collaborative learning methods.",
                "avatar_url": "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=400&auto=format&fit=crop&q=80",
                "city": "Tashkent",
                "country": "Uzbekistan",
                "lat": 41.2900,
                "lon": 69.2750,
                "activity_mode": "both",
                "group_size": "any",
                "looking_for": "Co-founders & SAT study buddies",
                "telegram": "@lucas_edtech",
                "interests": ["SAT Prep", "Startups & Venture", "Philosophy", "Science & Physics"],
                "skills": [("SAT Math", "Advanced"), ("Marketing", "Advanced"), ("Public Speaking", "Advanced")],
                "goals": ["Find Co-founder for EdTech", "Prepare for SAT Math 800"],
                "avail": [("Monday", "Morning (08:00-12:00)"), ("Thursday", "Morning (08:00-12:00)"), ("Saturday", "Morning (08:00-12:00)")]
            },
            {
                "username": "zuhra_kadir",
                "email": "zuhra@withme.app",
                "password": "password123",
                "display_name": "Zuhra Kadir",
                "headline": "Python Beginner & Data Enthusiast 📊",
                "bio": "Started learning Python and Pandas 2 months ago! Looking for fellow beginners to study daily, debug coding exercises, and stay motivated.",
                "avatar_url": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80",
                "city": "Tashkent",
                "country": "Uzbekistan",
                "lat": 41.3120,
                "lon": 69.2450,
                "activity_mode": "both",
                "group_size": "1-on-1",
                "looking_for": "Python study buddies & mentors",
                "telegram": "@zuhra_python",
                "interests": ["Programming", "Data Science", "Artificial Intelligence", "Reading & Literature"],
                "skills": [("Python", "Beginner"), ("SQL", "Beginner")],
                "goals": ["Learn React & TypeScript", "Daily Coding Accountability"],
                "avail": [("Monday", "Evening (18:00-22:00)"), ("Wednesday", "Evening (18:00-22:00)"), ("Friday", "Evening (18:00-22:00)")]
            }
        ]

        created_users = []
        for udata in users_data:
            user = User(
                username=udata["username"],
                email=udata["email"],
                is_admin=udata.get("is_admin", False),
                is_onboarded=True
            )
            user.set_password(udata["password"])
            db.session.add(user)
            db.session.flush()

            # Profile
            prof = Profile(
                user_id=user.id,
                display_name=udata["display_name"],
                headline=udata["headline"],
                bio=udata["bio"],
                avatar_url=udata["avatar_url"],
                city=udata["city"],
                country=udata["country"],
                activity_mode=udata["activity_mode"],
                preferred_group_size=udata["group_size"],
                looking_for_summary=udata["looking_for"],
                telegram=udata.get("telegram"),
                discord=udata.get("discord"),
                github=udata.get("github")
            )
            db.session.add(prof)

            # Location Preference
            f_lat, f_lon = fuzz_coordinates(udata["lat"], udata["lon"], user.id)
            loc = LocationPreference(
                user_id=user.id,
                location_enabled=True,
                approx_latitude=udata["lat"],
                approx_longitude=udata["lon"],
                fuzzed_latitude=f_lat,
                fuzzed_longitude=f_lon,
                discovery_radius_km=30,
                show_on_nearby=True,
                show_distance=True,
                show_city=True
            )
            db.session.add(loc)

            # Interests
            for iname in udata["interests"]:
                if iname in interest_map:
                    db.session.add(UserInterest(user_id=user.id, interest_id=interest_map[iname].id))

            # Skills
            for sname, lvl in udata["skills"]:
                if sname in skill_map:
                    db.session.add(UserSkill(user_id=user.id, skill_id=skill_map[sname].id, level=lvl))

            # Goals
            for gtitle in udata["goals"]:
                if gtitle in goal_map:
                    db.session.add(UserGoal(user_id=user.id, goal_id=goal_map[gtitle].id))

            # Availability
            for day, slot in udata["avail"]:
                db.session.add(Availability(user_id=user.id, day_of_week=day, time_slot=slot))

            created_users.append(user)

        db.session.commit()
        print(f"Created {len(created_users)} rich user profiles.")

        # 5. Connections between users
        # Alex (user 0) connected with Sarah, Marcus, Sofia, David
        u_alex = created_users[0]
        u_sarah = created_users[1]
        u_marcus = created_users[2]
        u_elena = created_users[3]
        u_david = created_users[4]
        u_sofia = created_users[5]
        u_jamshid = created_users[6]
        u_clara = created_users[7]
        u_timur = created_users[8]
        u_olivia = created_users[9]
        u_lucas = created_users[10]
        u_zuhra = created_users[11]

        conns = [
            Connection(requester_id=u_alex.id, addressee_id=u_david.id, status='accepted', message="Hey David! Saw your PyTorch work, let's build something together."),
            Connection(requester_id=u_alex.id, addressee_id=u_sofia.id, status='accepted', message="Hi Sofia! Would love your design input on an AI prototype."),
            Connection(requester_id=u_sarah.id, addressee_id=u_alex.id, status='accepted', message="Hey Alex, let's connect!"),
            Connection(requester_id=u_elena.id, addressee_id=u_sarah.id, status='accepted', message="Hi Sarah! Practice buddy for study sessions?"),
            Connection(requester_id=u_marcus.id, addressee_id=u_alex.id, status='pending', message="Hey! Saw you do React, looking for web game portals?"),
            Connection(requester_id=u_jamshid.id, addressee_id=u_alex.id, status='pending', message="Hey Alex, do you play football on Sundays?")
        ]
        db.session.add_all(conns)

        # Contact sharing between Alex and David
        cs = ContactShare(
            sender_id=u_david.id,
            recipient_id=u_alex.id,
            share_telegram=True,
            share_github=True,
            share_email=True
        )
        db.session.add(cs)

        # 6. Conversations & Sample Messages
        conv1 = Conversation(user1_id=min(u_alex.id, u_david.id), user2_id=max(u_alex.id, u_david.id))
        db.session.add(conv1)
        db.session.flush()

        m1 = Message(conversation_id=conv1.id, sender_id=u_alex.id, content="Hey David! How is the LLM fine-tuning project going?")
        m2 = Message(conversation_id=conv1.id, sender_id=u_david.id, content="Hey Alex! Just finished training a LoRA adapter on dataset pairs. Are you still open to building a React UI for it?")
        m3 = Message(conversation_id=conv1.id, sender_id=u_alex.id, content="Absolutely! We can build a sleek streaming chat UI with Next.js & Tailwind. Let's do a voice call on Discord this Saturday.")
        m4 = Message(conversation_id=conv1.id, sender_id=u_david.id, content="📇 Shared contact details (telegram, github, email)", message_type='contact_share', metadata_json={'channels': ['telegram', 'github', 'email']})
        db.session.add_all([m1, m2, m3, m4])

        conv2 = Conversation(user1_id=min(u_alex.id, u_sofia.id), user2_id=max(u_alex.id, u_sofia.id))
        db.session.add(conv2)
        db.session.flush()
        m5 = Message(conversation_id=conv2.id, sender_id=u_sofia.id, content="Hi Alex! I reviewed the wireframes for the study assistant app, they look super promising!")
        m6 = Message(conversation_id=conv2.id, sender_id=u_alex.id, content="Thanks Sofia! Would love your feedback on the navigation bar micro-interactions.")
        db.session.add_all([m5, m6])

        # 7. Activities (Online & In-person)
        activities_data = [
            {
                "creator": u_sarah,
                "title": "SAT Math 800 Sprint & Problem Solving",
                "category": "Study",
                "description": "Solving 40 challenging SAT Math problems covering advanced algebra, quadratic functions, and trigonometry. We share screens, discuss different solutions, and time each section.",
                "location_type": "in_person",
                "city": "Tashkent",
                "general_location": "Central Youth Library · Room 302",
                "lat": 41.3110,
                "lon": 69.2797,
                "date": "2026-09-12",
                "time": "15:00",
                "max": 6,
                "skills": "SAT Math, Algebra, Geometry"
            },
            {
                "creator": u_elena,
                "title": "IELTS Speaking Club & Topic Debates",
                "category": "Languages",
                "description": "Weekly speaking session focusing on Part 2 & Part 3 topic cards with peer feedback, pronunciation checks, and natural phrase idioms.",
                "location_type": "hybrid",
                "city": "Tashkent",
                "general_location": "Ground Cafe · Yunusabad & Zoom",
                "lat": 41.3050,
                "lon": 69.2310,
                "date": "2026-09-13",
                "time": "17:00",
                "max": 8,
                "skills": "IELTS Speaking, English Fluency"
            },
            {
                "creator": u_alex,
                "title": "React 19 & AI Web Apps Live Build",
                "category": "Coding",
                "description": "Pair programming session building a real-time collaborative workspace with React 19 Actions and Tailwind CSS. Beginners and experienced builders welcome.",
                "location_type": "online",
                "city": "Tashkent",
                "general_location": "Discord Stage & Live VS Code Live Share",
                "lat": 41.2995,
                "lon": 69.2401,
                "date": "2026-09-14",
                "time": "19:00",
                "max": 10,
                "skills": "React, TypeScript, Tailwind"
            },
            {
                "creator": u_jamshid,
                "title": "Sunday 5v5 Friendly Football Match",
                "category": "Sports",
                "description": "Casual Sunday football game on artificial grass. Friendly atmosphere, all skill levels welcome. Bring your indoor or turf boots!",
                "location_type": "in_person",
                "city": "Tashkent",
                "general_location": "Dinamo Sports Complex Pitch #2",
                "lat": 41.3400,
                "lon": 69.2900,
                "date": "2026-09-13",
                "time": "09:00",
                "max": 12,
                "skills": "Football, Teamwork"
            },
            {
                "creator": u_marcus,
                "title": "Indie 2D Game Dev Jam & Playtesting",
                "category": "Gaming",
                "description": "Showcasing current game prototypes, testing mechanics, and brainstorming pixel art animations together over Discord.",
                "location_type": "online",
                "city": "Tashkent",
                "general_location": "IndieDev Discord Server",
                "lat": 41.3275,
                "lon": 69.2817,
                "date": "2026-09-15",
                "time": "20:00",
                "max": 8,
                "skills": "Unity, C#, Pixel Art"
            },
            {
                "creator": u_clara,
                "title": "Acoustic Guitar & French Vocals Jam",
                "category": "Music",
                "description": "Casual acoustic jam session in the park. Learning popular indie folk songs and French acoustic classics.",
                "location_type": "in_person",
                "city": "Tashkent",
                "general_location": "Amir Timur Square Garden",
                "lat": 41.3000,
                "lon": 69.2550,
                "date": "2026-09-16",
                "time": "18:00",
                "max": 6,
                "skills": "Guitar, Music, Singing"
            }
        ]

        for adata in activities_data:
            act = Activity(
                creator_id=adata["creator"].id,
                title=adata["title"],
                category=adata["category"],
                description=adata["description"],
                location_type=adata["location_type"],
                city=adata["city"],
                general_location=adata["general_location"],
                approx_latitude=adata["lat"],
                approx_longitude=adata["lon"],
                event_date=adata["date"],
                event_time=adata["time"],
                max_participants=adata["max"],
                required_skills=adata["skills"],
                status="upcoming"
            )
            db.session.add(act)
            db.session.flush()

            # Add host
            db.session.add(ActivityParticipant(activity_id=act.id, user_id=adata["creator"].id, role='host'))
            # Add Alex to some activities
            if adata["creator"].id != u_alex.id:
                db.session.add(ActivityParticipant(activity_id=act.id, user_id=u_alex.id, role='member'))

        # 8. Projects
        projects_data = [
            {
                "creator": u_alex,
                "title": "AI Study Assistant & Smart Flashcard Platform",
                "category": "Startups",
                "description": "We are building an intelligent study copilot that transforms uploaded lecture PDFs into active recall questions, spaced-repetition cards, and conversational study quizzes.",
                "goals": "Launch MVP to 1,000 beta students and test engagement retention.",
                "looking_for": "Python ML Engineer, UI/UX Designer, Marketing Lead",
                "skills": "React, Python, PyTorch, Figma",
                "stage": "Prototype",
                "max": 5
            },
            {
                "creator": u_marcus,
                "title": "Echoes of the Spire — 2D Roguelike Game",
                "category": "Game Dev",
                "description": "Retro pixel-art roguelike dungeon crawler built in Unity. Procedural dungeon generation, dynamic spell synergies, and custom boss battles.",
                "goals": "Complete playable 3-level demo for Steam Next Fest.",
                "looking_for": "C# Gameplay Programmer, Sound FX Composer, Pixel Artist",
                "skills": "Unity, C#, Blender",
                "stage": "Prototype",
                "max": 4
            },
            {
                "creator": u_david,
                "title": "OpenResearch: LLM Paper Digest & Visualizer",
                "category": "Open Source",
                "description": "Open-source developer tool that summarizes daily arXiv CS/AI papers into interactive mind-maps and audio briefings.",
                "goals": "Build GitHub open-source community and deploy free public web app.",
                "looking_for": "Frontend React Dev, Technical Writer, Cloud DevOps",
                "skills": "Python, Next.js, Docker, NLP",
                "stage": "MVP",
                "max": 5
            }
        ]

        for pdata in projects_data:
            proj = Project(
                creator_id=pdata["creator"].id,
                title=pdata["title"],
                category=pdata["category"],
                description=pdata["description"],
                goals=pdata["goals"],
                looking_for_roles=pdata["looking_for"],
                required_skills=pdata["skills"],
                stage=pdata["stage"],
                max_members=pdata["max"]
            )
            db.session.add(proj)
            db.session.flush()

            db.session.add(ProjectMember(project_id=proj.id, user_id=pdata["creator"].id, role='Project Lead'))
            if pdata["creator"].id != u_alex.id:
                db.session.add(ProjectMember(project_id=proj.id, user_id=u_alex.id, role='Frontend Contributor'))

        # 9. Groups
        groups_data = [
            {
                "creator": u_sarah,
                "name": "SAT 2027 Study Guild",
                "category": "Study",
                "description": "Dedicated community for students preparing for the Digital SAT. Daily question challenges, math breakdowns, reading comprehension tips, and study schedules.",
                "avatar_url": "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=300&auto=format&fit=crop&q=80"
            },
            {
                "creator": u_alex,
                "name": "Indie Builders & AI Hackers",
                "category": "Startups",
                "description": "A collaborative circle for solo founders, full-stack builders, and AI enthusiasts shipping real products every week.",
                "avatar_url": "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=300&auto=format&fit=crop&q=80"
            },
            {
                "creator": u_elena,
                "name": "Global English & IELTS Club",
                "category": "Languages",
                "description": "Daily conversational practice, debate rooms, essay reviews, and idiom tips for ambitious language learners.",
                "avatar_url": "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=300&auto=format&fit=crop&q=80"
            },
            {
                "creator": u_marcus,
                "name": "Indie Game Developers Collective",
                "category": "Gaming",
                "description": "Game jams, mechanic playtesting, shader development, and game audio design.",
                "avatar_url": "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=300&auto=format&fit=crop&q=80"
            }
        ]

        for gdata in groups_data:
            grp = Group(
                creator_id=gdata["creator"].id,
                name=gdata["name"],
                category=gdata["category"],
                description=gdata["description"],
                avatar_url=gdata["avatar_url"]
            )
            db.session.add(grp)
            db.session.flush()

            db.session.add(GroupMember(group_id=grp.id, user_id=gdata["creator"].id, role='admin'))
            if gdata["creator"].id != u_alex.id:
                db.session.add(GroupMember(group_id=grp.id, user_id=u_alex.id, role='member'))
            if gdata["creator"].id != u_david.id and u_alex.id != u_david.id:
                db.session.add(GroupMember(group_id=grp.id, user_id=u_david.id, role='member'))
            if gdata["creator"].id != u_sarah.id and u_alex.id != u_sarah.id:
                db.session.add(GroupMember(group_id=grp.id, user_id=u_sarah.id, role='member'))

            # Pinned Announcement Message
            msg1 = GroupMessage(
                group_id=grp.id,
                author_id=gdata["creator"].id,
                content=f"📌 Welcome to {gdata['name']}! Please introduce yourself, share your current goals, and feel free to start study sprints or project teams anytime.",
                message_type='text',
                is_pinned=True,
                reactions={"👍": [u_alex.id, u_david.id], "🔥": [u_sarah.id]}
            )
            db.session.add(msg1)
            db.session.flush()

            # Chat Discussion Thread with Replies
            msg2 = GroupMessage(
                group_id=grp.id,
                author_id=u_alex.id,
                content="Hey everyone! Super excited to be here. Who is up for a weekend sprint session?",
                message_type='text',
                reactions={"❤️": [gdata["creator"].id], "🚀": [u_david.id]}
            )
            db.session.add(msg2)
            db.session.flush()

            msg3 = GroupMessage(
                group_id=grp.id,
                author_id=u_david.id,
                content="I'm in! Count me in for Saturday afternoon.",
                message_type='text',
                reply_to_id=msg2.id,
                reactions={"👍": [u_alex.id]}
            )
            db.session.add(msg3)

            # Sample Group Poll (like Telegram group poll)
            poll_obj = {
                "question": "When is the best time for our next live group session?",
                "options": [
                    {"id": "opt1", "text": "Saturday 15:00 - 18:00", "voters": [u_alex.id, u_david.id]},
                    {"id": "opt2", "text": "Sunday 18:00 - 21:00", "voters": [u_sarah.id]},
                    {"id": "opt3", "text": "Weekday evenings (20:00+)", "voters": []}
                ],
                "is_closed": False
            }
            poll_msg = GroupMessage(
                group_id=grp.id,
                author_id=gdata["creator"].id,
                content="📊 Group Poll: When is the best time for our next live group session?",
                message_type='poll',
                poll_data=poll_obj,
                reactions={"📊": [u_alex.id]}
            )
            db.session.add(poll_msg)

        # 10. Notifications for Alex
        notifs = [
            Notification(
                recipient_id=u_alex.id,
                sender_id=u_sarah.id,
                type="connection_accepted",
                title="Connection Accepted",
                message="Sarah Kim accepted your connection request!",
                link=f"/users/{u_sarah.id}"
            ),
            Notification(
                recipient_id=u_alex.id,
                sender_id=u_david.id,
                type="message",
                title="New Message",
                message="David Park sent you a message: 'Just finished training a LoRA adapter...'",
                link=f"/messages/{conv1.id}"
            ),
            Notification(
                recipient_id=u_alex.id,
                sender_id=u_marcus.id,
                type="connection_request",
                title="New Connection Request",
                message="Marcus Vance sent you a connection request.",
                link=f"/users/{u_marcus.id}"
            )
        ]
        db.session.add_all(notifs)

        # 10. Follow relationships (Instagram style)
        follows = [
            Follow(follower_id=u_sarah.id, followed_id=u_alex.id),
            Follow(follower_id=u_david.id, followed_id=u_alex.id),
            Follow(follower_id=u_marcus.id, followed_id=u_alex.id),
            Follow(follower_id=u_elena.id, followed_id=u_alex.id),
            Follow(follower_id=u_alex.id, followed_id=u_sarah.id),
            Follow(follower_id=u_alex.id, followed_id=u_david.id),
            Follow(follower_id=u_david.id, followed_id=u_sarah.id),
            Follow(follower_id=u_marcus.id, followed_id=u_david.id),
        ]
        db.session.add_all(follows)

        db.session.commit()
        print("Database seeding completed successfully!")

if __name__ == '__main__':
    seed_database()
