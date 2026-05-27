const fs = require('fs');
const path = require('path');
const { Blob } = require('buffer');

const BASE_URL = 'http://127.0.0.1:5000/api';
let jwtToken = '';
let cookieStr = '';

// Helper for fetch with cookies and headers
async function apiCall(endpoint, method = 'GET', body = null, isFormData = false) {
  const headers = {};
  if (jwtToken) {
    headers['Authorization'] = `Bearer ${jwtToken}`;
  }
  if (cookieStr) {
    headers['Cookie'] = cookieStr;
  }
  if (!isFormData && body) {
    headers['Content-Type'] = 'application/json';
  }

  const options = {
    method,
    headers,
  };
  
  if (body) {
    options.body = isFormData ? body : JSON.stringify(body);
  }

  const res = await fetch(`${BASE_URL}${endpoint}`, options);
  
  // Save set-cookie if any
  const setCookie = res.headers.get('set-cookie');
  if (setCookie) {
    // Only grab the first cookie for simplicity
    cookieStr = setCookie.split(';')[0];
  }

  let data;
  try {
    data = await res.json();
  } catch (e) {
    data = null;
  }

  return { status: res.status, data, headers: res.headers };
}

async function runTests() {
  console.log('=== Starting Lex_ai E2E Tests (Day 1 - Day 6) ===\n');

  try {
    // --- DAY 1 & 2: AUTH & PROFILE ---
    console.log('--- Day 1 & 2: Auth and Profile ---');
    const testEmail = `test_${Date.now()}@example.com`;
    const testPassword = 'Password123!';

    // Register
    let res = await apiCall('/auth/register', 'POST', {
      name: 'Test User',
      email: testEmail,
      password: testPassword
    });
    console.log(`Register: ${res.status}`);
    if (res.status !== 201) throw new Error('Registration failed: ' + JSON.stringify(res.data));
    jwtToken = res.data.token; // assume token might be returned, or we need to login

    // Login
    res = await apiCall('/auth/login', 'POST', {
      email: testEmail,
      password: testPassword
    });
    console.log(`Login: ${res.status}`);
    if (res.status !== 200) throw new Error('Login failed: ' + JSON.stringify(res.data));
    jwtToken = res.data.accessToken || res.data.token;
    if (!jwtToken) throw new Error('No JWT returned on login');

    // Profile GET
    res = await apiCall('/users/me', 'GET');
    console.log(`Get Profile: ${res.status}`);
    if (res.status !== 200 || !res.data) throw new Error('Get profile failed');
    if (res.data.passwordHash) throw new Error('Profile returned password hash!');

    // Update Profile
    res = await apiCall('/users/me', 'PUT', { name: 'Updated User' });
    console.log(`Update Profile: ${res.status}`);
    if (res.status !== 200) throw new Error('Update profile failed: ' + JSON.stringify(res.data));

    // Update Password
    res = await apiCall('/users/me/password', 'PUT', {
      currentPassword: testPassword,
      newPassword: 'NewPassword123!'
    });
    console.log(`Update Password: ${res.status}`);
    if (res.status !== 200) throw new Error('Update password failed: ' + JSON.stringify(res.data));

    // --- DAY 3: UPLOAD ---
    console.log('\n--- Day 3: Document Upload ---');
    const validPdfPath = path.join(__dirname, '..', 'test_document', 'valid-service-agreement-test.pdf');
    const invalidPdfPath = path.join(__dirname, '..', 'test_document', 'invalid-scanned-style-test.pdf');

    // Helper to upload
    const uploadPdf = async (filePath) => {
      const buffer = fs.readFileSync(filePath);
      const blob = new Blob([buffer], { type: 'application/pdf' });
      const formData = new FormData();
      formData.append('file', blob, path.basename(filePath));
      return await apiCall('/documents/upload', 'POST', formData, true);
    };

    // Invalid/Scanned PDF
    res = await uploadPdf(invalidPdfPath);
    console.log(`Upload Invalid PDF: ${res.status}`);
    if (res.status !== 422) throw new Error('Invalid PDF upload failed: ' + JSON.stringify(res.data));
    if (res.data.document.status !== 'scanned') throw new Error('Invalid PDF status is not "scanned". Got: ' + res.data.document.status);
    
    // Valid PDF
    res = await uploadPdf(validPdfPath);
    console.log(`Upload Valid PDF: ${res.status}`);
    if (res.status !== 200 && res.status !== 201) throw new Error('Valid PDF upload failed: ' + JSON.stringify(res.data));
    const validDocId = res.data.document.id || res.data.document._id;
    let docStatus = res.data.document.status;
    console.log(`Valid PDF ID: ${validDocId}, Status: ${docStatus}`);

    // Wait for extraction
    if (docStatus === 'extracting') {
      console.log('Waiting for extraction to finish...');
      for (let i = 0; i < 10; i++) {
        await new Promise(r => setTimeout(r, 2000));
        let checkRes = await apiCall(`/documents/${validDocId}`, 'GET');
        if (checkRes.status === 200) {
          docStatus = checkRes.data.status;
          if (docStatus === 'extracting' || docStatus === 'extracted' || docStatus === 'ready') break;
        }
      }
      console.log(`Status after waiting: ${docStatus}`);
      if (docStatus !== 'extracting' && docStatus !== 'extracted' && docStatus !== 'ready') {
        throw new Error('Document stuck in extracting or failed');
      }
    }

    // PDF Stream test
    const streamRes = await fetch(`${BASE_URL}/documents/${validDocId}/file`, {
      headers: { Authorization: `Bearer ${jwtToken}`, Cookie: cookieStr }
    });
    console.log(`PDF Stream Check: ${streamRes.status}`);
    if (streamRes.status !== 200) throw new Error('Failed to stream PDF');

    // --- DAY 4 & 5: CLAUSE DETECTION & SUMMARISATION ---
    console.log('\n--- Day 4 & 5: Clause Detection & AI ---');
    console.log('Triggering analysis...');
    res = await apiCall(`/documents/${validDocId}/analyse`, 'POST');
    console.log(`Analyse Trigger: ${res.status}`);
    if (res.status !== 200) throw new Error('Analyse trigger failed: ' + JSON.stringify(res.data));
    
    // Poll for status 'ready'
    console.log('Waiting for AI analysis to complete...');
    for (let i = 0; i < 30; i++) {
        await new Promise(r => setTimeout(r, 5000));
        let checkRes = await apiCall(`/documents/${validDocId}`, 'GET');
        if (checkRes.status === 200) {
          docStatus = checkRes.data.status;
          console.log(`Current status: ${docStatus}`);
          if (docStatus === 'ready') break;
        }
    }

    if (docStatus !== 'ready') throw new Error('Document analysis failed or timed out');

    // Verify Clauses
    res = await apiCall(`/documents/${validDocId}`, 'GET');
    const clauses = res.data.clauses;
    if (!clauses || clauses.length === 0) throw new Error('No clauses found on document');
    console.log(`Found ${clauses.length} clauses.`);
    
    // Check fields of first clause
    const firstClause = clauses[0];
    console.log(`First clause fields: summary=${!!firstClause.summary}, aiRiskLevel=${firstClause.aiRiskLevel}, keywordRiskLevel=${firstClause.keywordRiskLevel}`);
    if (!firstClause.summary) throw new Error('Clause is missing Groq summary');
    if (!firstClause.aiRiskLevel) throw new Error('Clause is missing AI risk level');
    
    // --- DAY 6: CHAT ---
    console.log('\n--- Day 6: RAG Chat ---');
    res = await apiCall(`/chat/${validDocId}`, 'POST', {
      question: 'What is the termination period?',
      message: 'What is the termination period?'
    });
    console.log(`Chat Question: ${res.status}`);
    if (res.status !== 200) throw new Error('Chat question failed: ' + JSON.stringify(res.data));
    console.log(`Chat Answer: ${res.data.reply}`);

    // Verify Chat History
    res = await apiCall(`/chat/${validDocId}`, 'GET');
    console.log(`Chat History: ${res.status}`);
    if (res.status !== 200 || !res.data.messages) throw new Error('Failed to get chat history');
    console.log(`Found ${res.data.messages.length} messages in history.`);

    console.log('\n=== ALL TESTS PASSED! ===');

  } catch (error) {
    console.error('\n!!! TEST FAILED !!!');
    console.error(error.message);
  }
}

runTests();
