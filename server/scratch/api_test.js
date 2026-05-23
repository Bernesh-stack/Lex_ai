const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:5000/api';

// Helper to generate a PDF buffer in-memory
const generatePdfBuffer = (text) => {
  return new Promise((resolve) => {
    const doc = new PDFDocument();
    const buffers = [];
    doc.on('data', buffers.push.bind(buffers));
    doc.on('end', () => resolve(Buffer.concat(buffers)));
    doc.text(text);
    doc.end();
  });
};

// Main test function
async function runTests() {
  console.log('==================================================');
  console.log('STARTING LEXAI BACKEND QA INTEGRATION TEST SUITE');
  console.log('==================================================\n');

  const results = [];
  const logResult = (name, passed, detail = '') => {
    results.push({ name, passed, detail });
    console.log(`[${passed ? 'PASS' : 'FAIL'}] ${name} ${detail ? `(${detail})` : ''}`);
  };

  let testUserToken = '';
  let refreshCookieHeader = '';
  let normalDocId = '';
  let scannedDocId = '';

  const testEmail = `qa_test_${Date.now()}@example.com`;
  const testPassword = 'Password123!';
  const updatedName = 'QA Tester Updated';
  const newPassword = 'NewPassword123!';

  // --- DAY 1 TESTS ---
  console.log('--- DAY 1: Authentication & Server Configuration ---');

  // 1. Server starts and health check is accessible
  try {
    const res = await fetch(`${BASE_URL}/health`);
    const data = await res.json();
    if (res.status === 200 && data.status === 'ok') {
      logResult('Health Check /api/health', true);
    } else {
      logResult('Health Check /api/health', false, `Status: ${res.status}`);
    }
  } catch (err) {
    logResult('Health Check /api/health', false, err.message);
  }

  // 2. Register: Validation check
  try {
    const res = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: '', email: 'invalid-email', password: '123' }),
    });
    const data = await res.json();
    if (res.status === 400 && data.message === 'Validation failed') {
      logResult('Auth Register Input Validation', true);
    } else {
      logResult('Auth Register Input Validation', false, `Status: ${res.status}`);
    }
  } catch (err) {
    logResult('Auth Register Input Validation', false, err.message);
  }

  // 3. Register: Success registration
  try {
    const res = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'QA Tester', email: testEmail, password: testPassword }),
    });
    const data = await res.json();
    const setCookie = res.headers.get('set-cookie');

    if (res.status === 201 && data.accessToken && data.user.email === testEmail) {
      testUserToken = data.accessToken;
      if (setCookie && setCookie.includes('refreshToken')) {
        refreshCookieHeader = setCookie.split(';')[0];
        logResult('Auth Register Success & Cookie Set', true);
      } else {
        logResult('Auth Register Success & Cookie Set', false, 'Access token returned but refresh cookie was not set');
      }
    } else {
      logResult('Auth Register Success & Cookie Set', false, `Status: ${res.status}, msg: ${data.message}`);
    }
  } catch (err) {
    logResult('Auth Register Success & Cookie Set', false, err.message);
  }

  // 4. Register: Duplicate Email Validation
  try {
    const res = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'QA Tester 2', email: testEmail, password: testPassword }),
    });
    if (res.status === 409) {
      logResult('Auth Register Unique Email Enforcement', true);
    } else {
      logResult('Auth Register Unique Email Enforcement', false, `Status: ${res.status}`);
    }
  } catch (err) {
    logResult('Auth Register Unique Email Enforcement', false, err.message);
  }

  // 5. Protected route fails without token
  try {
    const res = await fetch(`${BASE_URL}/users/me`);
    if (res.status === 401) {
      logResult('Route Protection: Fails without token', true);
    } else {
      logResult('Route Protection: Fails without token', false, `Status: ${res.status}`);
    }
  } catch (err) {
    logResult('Route Protection: Fails without token', false, err.message);
  }

  // 6. Protected route succeeds with valid token
  try {
    const res = await fetch(`${BASE_URL}/users/me`, {
      headers: { Authorization: `Bearer ${testUserToken}` },
    });
    const data = await res.json();
    if (res.status === 200 && data.email === testEmail) {
      logResult('Route Protection: Succeeds with valid token', true);
    } else {
      logResult('Route Protection: Succeeds with valid token', false, `Status: ${res.status}`);
    }
  } catch (err) {
    logResult('Route Protection: Succeeds with valid token', false, err.message);
  }

  // --- DAY 2 TESTS ---
  console.log('\n--- DAY 2: Profile API, Validation, & Service Placeholders ---');

  // 7. GET /api/users/me returns user and excludes passwordHash
  try {
    const res = await fetch(`${BASE_URL}/users/me`, {
      headers: { Authorization: `Bearer ${testUserToken}` },
    });
    const data = await res.json();
    if (res.status === 200 && data.email === testEmail && data.passwordHash === undefined) {
      logResult('Get Current User Profile & Exclude passwordHash', true);
    } else {
      logResult('Get Current User Profile & Exclude passwordHash', false, `passwordHash returned: ${data.passwordHash !== undefined}`);
    }
  } catch (err) {
    logResult('Get Current User Profile & Exclude passwordHash', false, err.message);
  }

  // 8. PUT /api/users/me updates profile correctly
  try {
    const res = await fetch(`${BASE_URL}/users/me`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${testUserToken}`,
      },
      body: JSON.stringify({ name: updatedName }),
    });
    const data = await res.json();
    if (res.status === 200 && data.user.name === updatedName) {
      logResult('Update Profile Name', true);
    } else {
      logResult('Update Profile Name', false, `Status: ${res.status}, name: ${data.user?.name}`);
    }
  } catch (err) {
    logResult('Update Profile Name', false, err.message);
  }

  // 9. PUT /api/users/me/password changes password successfully
  try {
    const res = await fetch(`${BASE_URL}/users/me/password`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${testUserToken}`,
      },
      body: JSON.stringify({ currentPassword: testPassword, newPassword: newPassword }),
    });
    if (res.status === 200) {
      logResult('Change Password Profile API', true);
    } else {
      logResult('Change Password Profile API', false, `Status: ${res.status}`);
    }
  } catch (err) {
    logResult('Change Password Profile API', false, err.message);
  }

  // 10. Verification of new password on login
  try {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testEmail, password: newPassword }),
    });
    const data = await res.json();
    if (res.status === 200 && data.accessToken) {
      testUserToken = data.accessToken; // update to new active token
      logResult('Login Verification with New Password', true);
    } else {
      logResult('Login Verification with New Password', false, `Status: ${res.status}`);
    }
  } catch (err) {
    logResult('Login Verification with New Password', false, err.message);
  }

  // 11. Verification of service placeholders existence
  const expectedServices = [
    'groq.service.js',
    'gemini.service.js',
    'clauseDetector.service.js',
    'riskEngine.service.js',
    'rag.service.js',
    'chromadb.service.js',
  ];
  let allServicesExist = true;
  for (const svc of expectedServices) {
    const svcPath = path.join(__dirname, '..', 'services', svc);
    if (!fs.existsSync(svcPath)) {
      allServicesExist = false;
      console.log(`[SVC MISSING] service placeholder file is missing: ${svc}`);
    }
  }
  logResult('Service Placeholder Files Exist', allServicesExist);

  // --- DAY 3 TESTS ---
  console.log('\n--- DAY 3: PDF Upload, GridFS, & Scanned PDF Detection ---');

  // Helper to generate dynamic file upload payload
  const createMultipartPayload = (filename, fileBuffer, mimeType) => {
    const boundary = '----WebKitFormBoundaryQA' + Math.random().toString(36).substring(2);
    const header = `--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="${filename}"\r\nContent-Type: ${mimeType}\r\n\r\n`;
    const footer = `\r\n--${boundary}--\r\n`;
    
    const totalLength = Buffer.byteLength(header) + fileBuffer.length + Buffer.byteLength(footer);
    const payload = Buffer.concat([
      Buffer.from(header, 'utf8'),
      fileBuffer,
      Buffer.from(footer, 'utf8')
    ]);

    return { payload, boundary };
  };

  // 12. Upload: Reject non-PDF file
  try {
    const fakeTextBuffer = Buffer.from('this is not a pdf file but plain text');
    const { payload, boundary } = createMultipartPayload('test.txt', fakeTextBuffer, 'text/plain');

    const res = await fetch(`${BASE_URL}/documents/upload`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${testUserToken}`,
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
      },
      body: payload,
    });
    const data = await res.json();
    if (res.status === 400 && data.message.includes('PDF')) {
      logResult('PDF Upload Only Enforcement (TXT Rejected)', true);
    } else {
      logResult('PDF Upload Only Enforcement (TXT Rejected)', false, `Status: ${res.status}, msg: ${data.message}`);
    }
  } catch (err) {
    logResult('PDF Upload Only Enforcement (TXT Rejected)', false, err.message);
  }

  // 13. Upload: Normal PDF text extraction & validation
  try {
    // Generate a normal PDF with enough readable text (> 200 chars)
    const longText = 'This is a normal readable PDF document designed for automated integration testing. It contains a decent amount of readable text to easily bypass the scanned PDF gate of 200 characters. We are writing multiple sentences here. The LexAI contract parser should extract this text, count the pages correctly, save it to Mongoose database under extracting status, and also store the binary file inside GridFS. Let us verify if this works perfectly.';
    const normalPdfBuffer = await generatePdfBuffer(longText);

    const { payload, boundary } = createMultipartPayload('normal_contract.pdf', normalPdfBuffer, 'application/pdf');

    const res = await fetch(`${BASE_URL}/documents/upload`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${testUserToken}`,
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
      },
      body: payload,
    });
    const data = await res.json();

    if (res.status === 201 && data.document.status === 'extracting') {
      normalDocId = data.document.id;
      logResult('Normal PDF Upload & Extraction Success', true, `DocID: ${normalDocId}, Status: ${data.document.status}`);
    } else {
      logResult('Normal PDF Upload & Extraction Success', false, `Status: ${res.status}, msg: ${data.message}`);
    }
  } catch (err) {
    logResult('Normal PDF Upload & Extraction Success', false, err.message);
  }

  // 14. Upload: Scanned PDF detection & status update
  try {
    // Generate a scanned PDF (very little text, less than 200 chars after trimming)
    const shortText = 'Scanned Image Dummy PDF';
    const scannedPdfBuffer = await generatePdfBuffer(shortText);

    const { payload, boundary } = createMultipartPayload('scanned_image.pdf', scannedPdfBuffer, 'application/pdf');

    const res = await fetch(`${BASE_URL}/documents/upload`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${testUserToken}`,
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
      },
      body: payload,
    });
    const data = await res.json();

    if (res.status === 422 && data.document.status === 'scanned') {
      scannedDocId = data.document.id;
      logResult('Scanned PDF Detection Enforcement (Returns 422)', true, `DocID: ${scannedDocId}, Status: ${data.document.status}`);
    } else {
      logResult('Scanned PDF Detection Enforcement (Returns 422)', false, `Status: ${res.status}, msg: ${data.message}`);
    }
  } catch (err) {
    logResult('Scanned PDF Detection Enforcement (Returns 422)', false, err.message);
  }

  // 15. GET /api/documents/:id/file streams PDF back
  if (normalDocId) {
    try {
      const res = await fetch(`${BASE_URL}/documents/${normalDocId}/file`, {
        headers: { Authorization: `Bearer ${testUserToken}` },
      });
      const buffer = await res.arrayBuffer();

      if (res.status === 200 && res.headers.get('content-type') === 'application/pdf' && buffer.byteLength > 100) {
        logResult('Stream Uploaded PDF from GridFS', true);
      } else {
        logResult('Stream Uploaded PDF from GridFS', false, `Status: ${res.status}, Content-Type: ${res.headers.get('content-type')}`);
      }
    } catch (err) {
      logResult('Stream Uploaded PDF from GridFS', false, err.message);
    }
  } else {
    logResult('Stream Uploaded PDF from GridFS', false, 'Skipped due to normalDocId missing');
  }

  // --- DAY 1 REFRESH & LOGOUT TESTS ---
  console.log('\n--- DAY 1/2: Refresh Token & Logout ---');

  // 16. POST /api/auth/refresh gets a new access token
  if (refreshCookieHeader) {
    try {
      const res = await fetch(`${BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: { Cookie: refreshCookieHeader },
      });
      const data = await res.json();
      if (res.status === 200 && data.accessToken) {
        logResult('Refresh Access Token via Cookie', true);
      } else {
        logResult('Refresh Access Token via Cookie', false, `Status: ${res.status}, msg: ${data.message}`);
      }
    } catch (err) {
      logResult('Refresh Access Token via Cookie', false, err.message);
    }
  } else {
    logResult('Refresh Access Token via Cookie', false, 'Skipped due to missing refresh cookie');
  }

  // 17. POST /api/auth/logout clears refresh cookie
  try {
    const res = await fetch(`${BASE_URL}/auth/logout`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${testUserToken}` },
    });
    const setCookie = res.headers.get('set-cookie');
    if (res.status === 200 && setCookie && setCookie.includes('refreshToken=;')) {
      logResult('Auth Logout Clears Refresh Cookie', true);
    } else {
      logResult('Auth Logout Clears Refresh Cookie', false, `Status: ${res.status}, Set-Cookie: ${setCookie}`);
    }
  } catch (err) {
    logResult('Auth Logout Clears Refresh Cookie', false, err.message);
  }

  // 18. DELETE /api/users/me works at basic level
  try {
    const res = await fetch(`${BASE_URL}/users/me`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${testUserToken}` },
    });
    const data = await res.json();
    if (res.status === 200) {
      logResult('Delete User Profile API', true);
    } else {
      logResult('Delete User Profile API', false, `Status: ${res.status}, msg: ${data.message}`);
    }
  } catch (err) {
    logResult('Delete User Profile API', false, err.message);
  }

  console.log('\n==================================================');
  console.log('INTEGRATION TEST SUMMARY RESULTS');
  console.log('==================================================');
  const allPassed = results.every(r => r.passed);
  console.log(`OVERALL STATUS: ${allPassed ? 'ALL PASSED!' : 'SOME FAILED!'}\n`);
  
  console.log(`Passed: ${results.filter(r => r.passed).length} / ${results.length}`);
  console.log('==================================================');
}

runTests();
