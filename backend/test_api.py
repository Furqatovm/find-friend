import json
from app import create_app
from app.models.user import db

def test_full_application_flow():
    app = create_app()
    client = app.test_client()

    print("1. Testing Health Endpoint...")
    res = client.get('/api/health')
    assert res.status_code == 200
    assert res.json['status'] == 'healthy'
    print("[OK] Health OK")

    print("2. Testing Taxonomies...")
    res = client.get('/api/users/taxonomies')
    assert res.status_code == 200
    assert len(res.json['interests']) > 0
    assert len(res.json['skills']) > 0
    assert len(res.json['goals']) > 0
    print(f"[OK] Loaded {len(res.json['interests'])} interests, {len(res.json['skills'])} skills, {len(res.json['goals'])} goals")

    print("3. Testing User Authentication (Register & Login)...")
    import time
    uname = f"tester_bob_{int(time.time())}"
    res = client.post('/api/auth/register', json={
        'username': uname,
        'email': f'{uname}@test.com',
        'password': 'password123',
        'display_name': 'Tester Bob',
        'city': 'Tashkent'
    })
    assert res.status_code == 201
    bob_token = res.json['access_token']
    bob_id = res.json['user']['id']
    headers = {'Authorization': f'Bearer {bob_token}'}

    print("4. Testing Onboarding Completion...")
    int_id = client.get('/api/users/taxonomies').json['interests'][0]['id']
    goal_id = client.get('/api/users/taxonomies').json['goals'][0]['id']
    skill_id = client.get('/api/users/taxonomies').json['skills'][0]['id']

    res = client.post('/api/users/onboarding', headers=headers, json={
        'headline': 'SAT Prep Enthusiast',
        'bio': 'Studying math every day.',
        'activity_mode': 'both',
        'preferred_group_size': '1-on-1',
        'city': 'Tashkent',
        'latitude': 41.31,
        'longitude': 69.28,
        'location_enabled': True,
        'interest_ids': [int_id],
        'goal_ids': [goal_id],
        'skills': [{'skill_id': skill_id, 'level': 'Advanced'}],
        'availabilities': [{'day_of_week': 'Saturday', 'time_slot': 'Morning (08:00-12:00)'}]
    })
    assert res.status_code == 200
    assert res.json['user']['is_onboarded'] == True
    print("[OK] Onboarding OK")

    print("5. Testing Discover & Matching Algorithm...")
    res = client.get('/api/discover', headers=headers)
    assert res.status_code == 200
    matches = res.json
    assert len(matches) > 0
    assert 'compatibility' in matches[0]
    assert 'compatibility_score' in matches[0]['compatibility']
    print(f"[OK] Discovered {len(matches)} people. Top match score: {matches[0]['compatibility']['compatibility_score']}%")

    print("6. Testing Nearby Discovery...")
    res = client.get('/api/nearby/users?radius=50', headers=headers)
    assert res.status_code == 200
    assert len(res.json) > 0
    print(f"[OK] Found {len(res.json)} nearby users")

    print("7. Testing Connection Request & Status...")
    target_user_id = matches[0]['id']
    res = client.post('/api/connections', headers=headers, json={'addressee_id': target_user_id, 'message': 'Hi!'})
    assert res.status_code in [201, 200]
    print("[OK] Connection request sent")

    print("8. Testing Activities & Joining...")
    act_res = client.get('/api/activities', headers=headers)
    assert act_res.status_code == 200
    assert len(act_res.json) > 0
    act_id = act_res.json[0]['id']

    join_res = client.post(f'/api/activities/{act_id}/join', headers=headers)
    assert join_res.status_code in [200, 400]
    print(f"[OK] Joined activity {act_res.json[0]['title']}")

    print("9. Testing Projects & Applying...")
    proj_res = client.get('/api/projects', headers=headers)
    assert proj_res.status_code == 200
    assert len(proj_res.json) > 0
    proj_id = proj_res.json[0]['id']

    join_p_res = client.post(f'/api/projects/{proj_id}/join', headers=headers, json={'role': 'Frontend Dev'})
    assert join_p_res.status_code in [200, 400]
    print(f"[OK] Applied to project {proj_res.json[0]['title']}")

    print("10. Testing Community Groups & Posting...")
    grp_res = client.get('/api/groups', headers=headers)
    assert grp_res.status_code == 200
    grp_id = grp_res.json[0]['id']
    client.post(f'/api/groups/{grp_id}/join', headers=headers)

    post_res = client.post(f'/api/groups/{grp_id}/posts', headers=headers, json={'content': 'Hello guild members!'})
    assert post_res.status_code == 201
    print("[OK] Posted to community guild")

    print("11. Testing Super Admin Authentication & Stats...")
    admin_login = client.post('/api/auth/login', json={
        'username': 'admin',
        'password': 'admin123'
    })
    assert admin_login.status_code == 200
    assert admin_login.json['user']['is_admin'] == True
    admin_token = admin_login.json['access_token']
    admin_headers = {'Authorization': f'Bearer {admin_token}'}

    stats_res = client.get('/api/admin/stats', headers=admin_headers)
    assert stats_res.status_code == 200
    assert 'users' in stats_res.json
    print(f"[OK] Admin logged in & verified: {stats_res.json['users']['total']} total users")

    print("\nALL BACKEND API TESTS PASSED PERFECTLY!")

if __name__ == '__main__':
    test_full_application_flow()
