
const fs = require('fs');

const logStream = fs.createWriteStream('verification_phase4_result.txt', { flags: 'w' });
const originalLog = console.log;

function log(msg) {
    const str = typeof msg === 'object' ? JSON.stringify(msg) : msg;
    originalLog(str);
    logStream.write(str + '\n');
}
console.log = function (d) { log(d); };
console.error = function (d) { log(d); };

async function testPhase4() {
    log('--- Phase 4 Verification: Admin Features ---');
    const baseURL = 'http://127.0.0.1:3000/api';
    const adminEmail = 'admin@axartechwave.com';
    const adminPass = 'admin123';
    const newPass = 'adminNew123';

    const post = async (url, data, token) => {
        const headers = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;
        try {
            const res = await fetch(url, { method: 'POST', headers, body: JSON.stringify(data) });
            if (!res.ok) return { error: true, status: res.status, text: await res.text() };
            return res.json();
        } catch (e) { return { error: true, message: e.message }; }
    };

    const get = async (url, token) => {
        const headers = {};
        if (token) headers['Authorization'] = `Bearer ${token}`;
        try {
            const res = await fetch(url, { headers });
            if (!res.ok) return { error: true, status: res.status, text: await res.text() };
            return res.json();
        } catch (e) { return { error: true, message: e.message }; }
    };

    try {
        // 1. Admin Login
        log('1. Admin Login...');
        let loginRes = await post(`${baseURL}/auth/login`, { email: adminEmail, password: adminPass });
        if (loginRes.error) throw new Error(`Login Failed: ${loginRes.status} ${loginRes.text}`);
        let token = loginRes.access_token;
        log('   Login Successful.');

        // 2. Fetch All Orders (Admin)
        log('\n2. Testing Admin Order View...');
        const orders = await get(`${baseURL}/orders/admin/all`, token);
        if (orders.error) throw new Error(`Fetch Orders Failed: ${orders.status} ${orders.text}`);
        log(`   Orders Found: ${orders.length}`);
        if (orders.length > 0) {
            log(`   First Order User: ${orders[0].user ? orders[0].user.email : 'None'}`);
        }

        // 3. Change Password
        log('\n3. Changing Password...');
        const changeRes = await post(`${baseURL}/auth/change-password`, { oldPassword: adminPass, newPassword: newPass }, token);
        if (changeRes.error) throw new Error(`Change Password Failed: ${changeRes.status} ${changeRes.text}`);
        log('   Password Changed Successfully.');

        // 4. Re-login with New Password
        log('\n4. Verifying New Password...');
        loginRes = await post(`${baseURL}/auth/login`, { email: adminEmail, password: newPass });
        if (loginRes.error) throw new Error(`Re-Login Failed: ${loginRes.status} ${loginRes.text}`);
        token = loginRes.access_token;
        log('   Re-Login Successful.');

        // 5. Revert Password (Cleanup)
        log('\n5. Reverting Password...');
        const revertRes = await post(`${baseURL}/auth/change-password`, { oldPassword: newPass, newPassword: adminPass }, token);
        if (revertRes.error) throw new Error(`Revert Password Failed`);
        log('   Password Reverted.');

        log('\n--- PHASE 4 VERIFICATION COMPLETE: ALL SUCCESS ---');

    } catch (error) {
        log('\n!!! VERIFICATION FAILED !!!');
        log(error.message);
    } finally {
        logStream.end();
    }
}

testPhase4();
