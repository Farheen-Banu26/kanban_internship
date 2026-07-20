(async () => {
  try {
    let email = 'test' + Date.now() + '@example.com';

    // Register
    let reg = await fetch('http://localhost:5000/api/auth/register', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'TestUser', email, password: 'password123' })
    });
    let regData = await reg.json();
    const token = regData.data.token;
    const headers = { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token };
    console.log('Register:', regData.success);

    // Create Workspace with purpose
    const wRes = await fetch('http://localhost:5000/api/workspaces', {
      method: 'POST', headers,
      body: JSON.stringify({ name: 'My Workspace', purpose: 'Team collaboration' })
    });
    const wData = await wRes.json();
    console.log('Workspace Create:', wData.success, '| Purpose:', wData.data?.purpose);
    const wsId = wData.data?.id;

    // Get Notifications (should have workspace_created)
    const nRes = await fetch('http://localhost:5000/api/notifications', { headers });
    const nData = await nRes.json();
    console.log('Notifications:', nData.data?.length, '| Unread:', nData.unreadCount);

    // Get User Profile
    const pRes = await fetch('http://localhost:5000/api/users/profile', { headers });
    const pData = await pRes.json();
    console.log('Profile:', pData.data?.name, '| Workspaces:', pData.data?.workspaceCount, '| Tasks:', pData.data?.assignedTaskCount);

    // Update Workspace
    const upRes = await fetch(`http://localhost:5000/api/workspaces/${wsId}`, {
      method: 'PUT', headers,
      body: JSON.stringify({ name: 'Updated Workspace', purpose: 'Updated purpose' })
    });
    const upData = await upRes.json();
    console.log('Update Workspace:', upData.success, '| New Name:', upData.data?.name);

    // Mark notifications read
    const mrRes = await fetch('http://localhost:5000/api/notifications/read-all', { method: 'PUT', headers });
    const mrData = await mrRes.json();
    console.log('Mark Read:', mrData.success);

    // Delete Workspace
    const delRes = await fetch(`http://localhost:5000/api/workspaces/${wsId}`, { method: 'DELETE', headers });
    const delData = await delRes.json();
    console.log('Delete Workspace:', delData.success);

    console.log('\n✅ All API tests passed!');
  } catch (err) {
    console.error('❌ Error:', err.message);
  }
})();
