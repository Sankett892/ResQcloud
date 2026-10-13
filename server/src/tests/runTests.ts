import http from 'http';
import app from '../app.js';
import prisma from '../utils/prisma.js';

let server: http.Server;
const PORT = 5099;
const BASE_URL = `http://localhost:${PORT}/api`;

let citizenToken: string = '';
let operatorToken: string = '';
let createdIncidentId: string = '';
const testTimestamp = Date.now();
const testClientIncidentId = `test-client-id-${testTimestamp}`;

let passedCount = 0;
let failedCount = 0;

function assert(condition: boolean, message: string) {
  if (condition) {
    console.log(`  ✓ PASS: ${message}`);
    passedCount++;
  } else {
    console.error(`  ✗ FAIL: ${message}`);
    failedCount++;
    throw new Error(`Assertion failed: ${message}`);
  }
}

async function request(path: string, options: { method?: string; body?: any; token?: string } = {}) {
  const url = `${BASE_URL}${path}`;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (options.token) {
    headers['Authorization'] = `Bearer ${options.token}`;
  }

  const response = await fetch(url, {
    method: options.method || 'GET',
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const data: any = await response.json().catch(() => null);
  return { status: response.status, data };
}

async function runAllTests() {
  console.log('\n============================================================');
  console.log('🧪 Starting ResQCloud Automated Backend Test Suite');
  console.log('============================================================\n');

  // Test 1: Citizen Registration
  console.log('Test 1: Citizen Registration');
  const regEmail = `testuser_${testTimestamp}@resqcloud.test`;
  const regRes = await request('/auth/register', {
    method: 'POST',
    body: {
      name: 'Test Citizen User',
      email: regEmail,
      password: 'TestPassword@123',
    },
  });
  assert(regRes.status === 201, 'Citizen registration returns 201 Created');
  assert(regRes.data?.user?.role === 'CITIZEN', 'Registered user has CITIZEN role');
  assert(!!regRes.data?.token, 'Registration returns valid JWT auth token');

  // Test 2: Login and Logout
  console.log('\nTest 2: Login and Logout');
  const loginRes = await request('/auth/login', {
    method: 'POST',
    body: {
      email: regEmail,
      password: 'TestPassword@123',
    },
  });
  assert(loginRes.status === 200, 'Login returns 200 OK with correct credentials');
  citizenToken = loginRes.data.token;

  // Login as seeded rescue operator for subsequent operator tests
  const opLoginRes = await request('/auth/login', {
    method: 'POST',
    body: {
      email: 'operator@resqcloud.org',
      password: 'Operator@123',
    },
  });
  assert(opLoginRes.status === 200, 'Seeded rescue operator logs in successfully');
  assert(opLoginRes.data?.user?.role === 'RESCUE_OPERATOR', 'Operator has RESCUE_OPERATOR role');
  operatorToken = opLoginRes.data.token;

  const logoutRes = await request('/auth/logout', { method: 'POST' });
  assert(logoutRes.status === 200, 'Logout succeeds with 200 OK');

  // Test 3: Unauthorized Access Rejection
  console.log('\nTest 3: Unauthorized Access Rejection');
  const unauthRes = await request('/incidents');
  assert(unauthRes.status === 401, 'Unauthenticated request to /incidents returns 401');

  // Test 4: Valid Incident Creation
  console.log('\nTest 4: Valid Incident Creation');
  const createRes = await request('/incidents', {
    method: 'POST',
    token: citizenToken,
    body: {
      clientIncidentId: testClientIncidentId,
      disasterType: 'FLOOD',
      title: 'Sudden Flash Flooding Near Subway',
      description: 'Water has risen 3 feet quickly. 4 people stranded in car.',
      affectedPeople: 4,
      medicalAssistanceRequired: false,
      peopleTrapped: true,
      severity: 'HIGH',
      locationDescription: 'JM Road Subway, Pune',
      latitude: 18.5204,
      longitude: 73.8567,
      region: 'Pune City',
    },
  });
  assert(createRes.status === 201, 'Incident creation returns 201 Created');
  assert(createRes.data?.incident?.status === 'PENDING_REVIEW', 'Initial incident status is PENDING_REVIEW');
  createdIncidentId = createRes.data?.incident?.id;

  // Test 5: Incident Retrieval and Ownership Restrictions
  console.log('\nTest 5: Incident Retrieval and Ownership Restrictions');
  const getCitizenIncidents = await request('/incidents', { token: citizenToken });
  assert(getCitizenIncidents.status === 200, 'Citizen can list their incidents');
  const found = getCitizenIncidents.data?.incidents?.some((i: any) => i.id === createdIncidentId);
  assert(found, 'Citizen list contains their created incident');

  // Test 6: Rescue Operator Status Update
  console.log('\nTest 6: Rescue Operator Status Updates');
  const ackRes = await request(`/incidents/${createdIncidentId}/status`, {
    method: 'PATCH',
    token: operatorToken,
    body: {
      status: 'ACKNOWLEDGED',
      note: 'Dispatch unit assigned and alerted.',
    },
  });
  assert(ackRes.status === 200, 'Rescue operator can acknowledge incident');
  assert(ackRes.data?.incident?.status === 'ACKNOWLEDGED', 'Incident status updated to ACKNOWLEDGED');

  // Test 7: Invalid Status Transitions
  console.log('\nTest 7: Invalid Status Transitions');
  // From ACKNOWLEDGED, valid is IN_PROGRESS or CANCELLED. Jumping straight to RESOLVED is prohibited.
  const invalidTransitionRes = await request(`/incidents/${createdIncidentId}/status`, {
    method: 'PATCH',
    token: operatorToken,
    body: {
      status: 'RESOLVED',
      note: 'Attempting invalid jump without in-progress step.',
    },
  });
  assert(invalidTransitionRes.status === 400, 'Invalid transition rejected with 400 Bad Request');

  // Ordinary citizen cannot change incident status
  const citizenUnauthorizedUpdate = await request(`/incidents/${createdIncidentId}/status`, {
    method: 'PATCH',
    token: citizenToken,
    body: {
      status: 'RESOLVED',
    },
  });
  assert(citizenUnauthorizedUpdate.status === 403, 'Citizen forbidden from updating status (403)');

  // Test 8: Duplicate Synchronization Handling (Idempotency)
  console.log('\nTest 8: Duplicate Synchronization Handling (Idempotency)');
  const syncRes = await request('/incidents/sync', {
    method: 'POST',
    token: citizenToken,
    body: {
      reports: [
        {
          // Submitting existing client incident id
          clientIncidentId: testClientIncidentId,
          disasterType: 'FLOOD',
          title: 'Sudden Flash Flooding Near Subway',
          description: 'Water has risen 3 feet quickly. 4 people stranded in car.',
          affectedPeople: 4,
          medicalAssistanceRequired: false,
          peopleTrapped: true,
          severity: 'HIGH',
          locationDescription: 'JM Road Subway, Pune',
          latitude: 18.5204,
          longitude: 73.8567,
          region: 'Pune City',
          createdAt: new Date().toISOString(),
        },
        {
          // Submitting a brand new offline report
          clientIncidentId: `test-offline-sync-${testTimestamp}`,
          disasterType: 'FIRE',
          title: 'Offline Cached Fire Incident Report',
          description: 'Reported while offline and queued in IndexedDB.',
          affectedPeople: 2,
          medicalAssistanceRequired: false,
          peopleTrapped: false,
          severity: 'MEDIUM',
          locationDescription: 'Kalyani Nagar, Pune',
          latitude: 18.5463,
          longitude: 73.9034,
          region: 'Pune City',
          createdAt: new Date(Date.now() - 60000).toISOString(),
        },
      ],
    },
  });
  assert(syncRes.status === 200, 'Sync endpoint returns 200 OK');
  const duplicateItem = syncRes.data?.results?.find((r: any) => r.clientIncidentId === testClientIncidentId);
  assert(duplicateItem?.isDuplicate === true, 'Existing incident detected as duplicate');
  assert(duplicateItem?.syncStatus === 'SERVER_RECEIVED', 'Duplicate report acknowledged without error');

  const newItem = syncRes.data?.results?.find((r: any) => r.clientIncidentId === `test-offline-sync-${testTimestamp}`);
  assert(newItem?.isDuplicate === false, 'New offline incident saved successfully');
  assert(newItem?.syncStatus === 'SERVER_RECEIVED', 'New incident status is SERVER_RECEIVED');

  // Test 9: Incident History Creation
  console.log('\nTest 9: Incident History Creation');
  const historyRes = await request(`/incidents/${createdIncidentId}/history`, { token: citizenToken });
  assert(historyRes.status === 200, 'Incident history retrieved successfully');
  assert(historyRes.data?.history?.length >= 2, 'History contains creation and acknowledgment records');

  // Test 10: Validation of Malformed Requests
  console.log('\nTest 10: Validation of Malformed Requests');
  const malformedRes = await request('/incidents', {
    method: 'POST',
    token: citizenToken,
    body: {
      // Missing title, disasterType, locationDescription
      affectedPeople: 'invalid_number',
    },
  });
  assert(malformedRes.status === 400, 'Malformed request rejected with 400 Bad Request');

  console.log('\n============================================================');
  console.log(`🎉 Test Suite Complete: ${passedCount} PASSED, ${failedCount} FAILED`);
  console.log('============================================================\n');
}

async function start() {
  server = app.listen(PORT, async () => {
    try {
      await runAllTests();
      server.close();
      await prisma.$disconnect();
      process.exit(0);
    } catch (err) {
      console.error('\n❌ Test suite failed with exception:', err);
      server.close();
      await prisma.$disconnect();
      process.exit(1);
    }
  });
}

start();
