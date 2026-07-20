(async () => {
  try {
    let email = 'test' + Date.now() + '@example.com';
    let reg = await fetch('http://localhost:5000/api/auth/register', { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Test', email, password: 'password123' }) 
    });
    let regData = await reg.json();
    console.log('Register response:', regData);
    if (!reg.ok) return;

    const wRes = await fetch('http://localhost:5000/api/workspaces', {
      headers: { Authorization: 'Bearer ' + regData.data.token }
    });
    const wData = await wRes.json();
    console.log('Workspaces:', wData);
  } catch (err) {
    console.error(err);
  }
})();
