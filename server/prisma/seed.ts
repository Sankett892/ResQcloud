import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('--- Starting ResQCloud Demonstration Database Seeding ---');

  const salt = await bcrypt.genSalt(10);
  const citizenPasswordHash = await bcrypt.hash('Citizen@123', salt);
  const operatorPasswordHash = await bcrypt.hash('Operator@123', salt);
  const adminPasswordHash = await bcrypt.hash('Admin@123', salt);

  // 1. Seed Users (Upsert to ensure repeatability)
  const citizen1 = await prisma.user.upsert({
    where: { email: 'citizen@resqcloud.org' },
    update: {},
    create: {
      name: 'Aarav Sharma',
      email: 'citizen@resqcloud.org',
      passwordHash: citizenPasswordHash,
      role: 'CITIZEN',
    },
  });

  const citizen2 = await prisma.user.upsert({
    where: { email: 'priya@resqcloud.org' },
    update: {},
    create: {
      name: 'Priya Patel',
      email: 'priya@resqcloud.org',
      passwordHash: citizenPasswordHash,
      role: 'CITIZEN',
    },
  });

  const operator1 = await prisma.user.upsert({
    where: { email: 'operator@resqcloud.org' },
    update: {},
    create: {
      name: 'Vikram Deshmukh (Rescue Commander)',
      email: 'operator@resqcloud.org',
      passwordHash: operatorPasswordHash,
      role: 'RESCUE_OPERATOR',
    },
  });

  const operator2 = await prisma.user.upsert({
    where: { email: 'ananya@resqcloud.org' },
    update: {},
    create: {
      name: 'Ananya Kulkarni (Field Officer)',
      email: 'ananya@resqcloud.org',
      passwordHash: operatorPasswordHash,
      role: 'RESCUE_OPERATOR',
    },
  });

  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@resqcloud.org' },
    update: {},
    create: {
      name: 'Disaster Bureau Director (Admin)',
      email: 'admin@resqcloud.org',
      passwordHash: adminPasswordHash,
      role: 'ADMIN',
    },
  });

  console.log('✓ Users created / updated.');

  // 2. Sample Demonstration Incidents in Pune Metropolitan Region
  const sampleIncidents = [
    {
      clientIncidentId: 'inc-pune-demo-001',
      reporterId: citizen1.id,
      disasterType: 'FLOOD',
      title: 'Mutha River Overflow Flooding Ground Floor Apartments',
      description: 'Water level risen 4 feet near river bank. 12 residents including elderly stuck in ground floor flats. Power lines tripped.',
      affectedPeople: 12,
      medicalAssistanceRequired: true,
      peopleTrapped: true,
      severity: 'CRITICAL',
      locationDescription: 'Near Baba Bhide Bridge, Deccan Gymkhana, Pune City',
      latitude: 18.5167,
      longitude: 73.8428,
      region: 'Pune City',
      status: 'IN_PROGRESS',
      assignedOperatorId: operator1.id,
      createdAt: new Date(Date.now() - 3 * 3600 * 1000), // 3 hours ago
    },
    {
      clientIncidentId: 'inc-pune-demo-002',
      reporterId: citizen2.id,
      disasterType: 'LANDSLIDE',
      title: 'Sinhagad Ghat Road Rockfall Blocking Emergency Vehicles',
      description: 'Major rockfall and mudslide across km 4.2 marker. Several passenger cars stranded between bends. No heavy casualties reported yet.',
      affectedPeople: 18,
      medicalAssistanceRequired: false,
      peopleTrapped: true,
      severity: 'HIGH',
      locationDescription: 'Sinhagad Ghat Road, Donje Phata, Sinhagad Road',
      latitude: 18.3664,
      longitude: 73.7559,
      region: 'Sinhagad Road',
      status: 'ACKNOWLEDGED',
      assignedOperatorId: operator2.id,
      createdAt: new Date(Date.now() - 5 * 3600 * 1000),
    },
    {
      clientIncidentId: 'inc-pune-demo-003',
      reporterId: citizen1.id,
      disasterType: 'FIRE',
      title: 'Chemical Storage Warehouse Fire with Toxic Fumes',
      description: 'Dense black smoke emitting from solvent warehouse in Phase 2. Nearby IT offices evacuated. Fire tender access required immediately.',
      affectedPeople: 25,
      medicalAssistanceRequired: true,
      peopleTrapped: false,
      severity: 'CRITICAL',
      locationDescription: 'MIDC Industrial Area, Phase 2, Hinjawadi',
      latitude: 18.5982,
      longitude: 73.7225,
      region: 'Hinjawadi',
      status: 'IN_PROGRESS',
      assignedOperatorId: operator1.id,
      createdAt: new Date(Date.now() - 1.5 * 3600 * 1000),
    },
    {
      clientIncidentId: 'inc-pune-demo-004',
      reporterId: citizen2.id,
      disasterType: 'BUILDING_COLLAPSE',
      title: 'Old Commercial Facade Structural Collapse',
      description: 'Portion of 3-storey old building balcony collapsed over pedestrian walkway. Debris blocking entrance. 2 people pinned by rubble.',
      affectedPeople: 5,
      medicalAssistanceRequired: true,
      peopleTrapped: true,
      severity: 'CRITICAL',
      locationDescription: 'Near Mandai Market, Shukrawar Peth, Pune City',
      latitude: 18.5113,
      longitude: 73.8562,
      region: 'Pune City',
      status: 'PENDING_REVIEW',
      assignedOperatorId: null,
      createdAt: new Date(Date.now() - 45 * 60 * 1000), // 45 mins ago
    },
    {
      clientIncidentId: 'inc-pune-demo-005',
      reporterId: citizen1.id,
      disasterType: 'SEVERE_WEATHER',
      title: 'Uprooted Ancient Trees Blocking Solapur Highway',
      description: 'High gale winds tore down 3 large banyan trees and electric poles across all 4 lanes. Traffic halted completely. Live wires sparking.',
      affectedPeople: 40,
      medicalAssistanceRequired: false,
      peopleTrapped: false,
      severity: 'HIGH',
      locationDescription: 'Pune-Solapur Road, Near Gadital, Hadapsar',
      latitude: 18.5024,
      longitude: 73.9312,
      region: 'Hadapsar',
      status: 'ACKNOWLEDGED',
      assignedOperatorId: operator2.id,
      createdAt: new Date(Date.now() - 6 * 3600 * 1000),
    },
    {
      clientIncidentId: 'inc-pune-demo-006',
      reporterId: citizen2.id,
      disasterType: 'MEDICAL_EMERGENCY',
      title: 'Mass Oxygen Cylinder Deficit at Disaster Relief Camp',
      description: 'Temporary clinic set up for flood victims running out of pediatric and adult O2 cylinders. Immediate convoy transport needed.',
      affectedPeople: 15,
      medicalAssistanceRequired: true,
      peopleTrapped: false,
      severity: 'CRITICAL',
      locationDescription: 'Community Hall Relief Shelter, Kharadi Bypass, Kharadi',
      latitude: 18.5471,
      longitude: 73.9385,
      region: 'Kharadi',
      status: 'IN_PROGRESS',
      assignedOperatorId: operator1.id,
      createdAt: new Date(Date.now() - 2 * 3600 * 1000),
    },
    {
      clientIncidentId: 'inc-pune-demo-007',
      reporterId: citizen1.id,
      disasterType: 'FLOOD',
      title: 'Pavana River Backwater Inundation in Residential Slums',
      description: 'Low-lying huts submerged up to window level. Rapid evacuation required for approximately 60 people to designated relief school.',
      affectedPeople: 60,
      medicalAssistanceRequired: false,
      peopleTrapped: true,
      severity: 'HIGH',
      locationDescription: 'Near Morwadi Bridge, Pimpri-Chinchwad',
      latitude: 18.6298,
      longitude: 73.7997,
      region: 'Pimpri-Chinchwad',
      status: 'ACKNOWLEDGED',
      assignedOperatorId: operator2.id,
      createdAt: new Date(Date.now() - 4 * 3600 * 1000),
    },
    {
      clientIncidentId: 'inc-pune-demo-008',
      reporterId: citizen2.id,
      disasterType: 'FIRE',
      title: 'Electrical Substation Transformer Explosion',
      description: 'Transformer fire caused blackouts across surrounding sectors. Fire department dispatched foam units. Cooling operation underway.',
      affectedPeople: 8,
      medicalAssistanceRequired: false,
      peopleTrapped: false,
      severity: 'MEDIUM',
      locationDescription: 'Sector 24, Near Pradhikaran, Nigdi, Pimpri-Chinchwad',
      latitude: 18.6542,
      longitude: 73.7781,
      region: 'Pimpri-Chinchwad',
      status: 'RESOLVED',
      assignedOperatorId: operator2.id,
      createdAt: new Date(Date.now() - 24 * 3600 * 1000),
      resolvedAt: new Date(Date.now() - 20 * 3600 * 1000),
    },
    {
      clientIncidentId: 'inc-pune-demo-009',
      reporterId: citizen1.id,
      disasterType: 'EARTHQUAKE',
      title: 'Tremors Causing Cracked Water Pipeline & Gas Leak Scares',
      description: 'Mild seismic tremor caused water main rupture and suspected domestic LPG leaks in row housing society. Perimeter secured.',
      affectedPeople: 30,
      medicalAssistanceRequired: false,
      peopleTrapped: false,
      severity: 'MEDIUM',
      locationDescription: 'Mayur Colony, Kothrud, Pune',
      latitude: 18.5085,
      longitude: 73.8112,
      region: 'Pune City',
      status: 'RESOLVED',
      assignedOperatorId: operator1.id,
      createdAt: new Date(Date.now() - 18 * 3600 * 1000),
      resolvedAt: new Date(Date.now() - 14 * 3600 * 1000),
    },
    {
      clientIncidentId: 'inc-pune-demo-010',
      reporterId: citizen2.id,
      disasterType: 'OTHER',
      title: 'Communication Tower Power Backup Failure in Flood Zone',
      description: 'Primary cellular tower battery backup exhausted. Mobile network blackout affecting emergency SOS forwarding in 3km radius.',
      affectedPeople: 150,
      medicalAssistanceRequired: false,
      peopleTrapped: false,
      severity: 'HIGH',
      locationDescription: 'Near EON Free Zone Gate 3, Kharadi',
      latitude: 18.5558,
      longitude: 73.9515,
      region: 'Kharadi',
      status: 'PENDING_REVIEW',
      assignedOperatorId: null,
      createdAt: new Date(Date.now() - 30 * 60 * 1000), // 30 mins ago
    },
    {
      clientIncidentId: 'inc-pune-demo-011',
      reporterId: citizen1.id,
      disasterType: 'LANDSLIDE',
      title: 'Debris Flow on Khadakwasla Dam Backwater Trail',
      description: 'Soil erosion and fallen boulders blocking access to agricultural settlements. Tractors clearing secondary path.',
      affectedPeople: 14,
      medicalAssistanceRequired: false,
      peopleTrapped: false,
      severity: 'LOW',
      locationDescription: 'Gorhe Budruk, Sinhagad Road Outer',
      latitude: 18.4231,
      longitude: 73.7489,
      region: 'Sinhagad Road',
      status: 'RESOLVED',
      assignedOperatorId: operator2.id,
      createdAt: new Date(Date.now() - 48 * 3600 * 1000),
      resolvedAt: new Date(Date.now() - 36 * 3600 * 1000),
    },
    {
      clientIncidentId: 'inc-pune-demo-012',
      reporterId: citizen2.id,
      disasterType: 'MEDICAL_EMERGENCY',
      title: 'Pregnant Woman Cut Off by Waterlogged Underpass',
      description: 'Ambulance unable to navigate 5-foot waterlogged subway under railway line. Immediate high-ground boat transfer needed.',
      affectedPeople: 2,
      medicalAssistanceRequired: true,
      peopleTrapped: true,
      severity: 'CRITICAL',
      locationDescription: 'Hadapsar Railway Crossing Subway, Magarpatta Road, Hadapsar',
      latitude: 18.5145,
      longitude: 73.9298,
      region: 'Hadapsar',
      status: 'IN_PROGRESS',
      assignedOperatorId: operator1.id,
      createdAt: new Date(Date.now() - 1 * 3600 * 1000),
    },
    {
      clientIncidentId: 'inc-pune-demo-013',
      reporterId: citizen1.id,
      disasterType: 'FLOOD',
      title: 'Basement Parking Submersion at Tech Park Hub',
      description: 'Over 40 vehicles underwater after drainage canal broke revetment wall. Pumps deployed by disaster management team.',
      affectedPeople: 10,
      medicalAssistanceRequired: false,
      peopleTrapped: false,
      severity: 'MEDIUM',
      locationDescription: 'Blue Ridge Township, Phase 1, Hinjawadi',
      latitude: 18.5834,
      longitude: 73.7392,
      region: 'Hinjawadi',
      status: 'ACKNOWLEDGED',
      assignedOperatorId: operator2.id,
      createdAt: new Date(Date.now() - 7 * 3600 * 1000),
    },
    {
      clientIncidentId: 'inc-pune-demo-014',
      reporterId: citizen2.id,
      disasterType: 'SEVERE_WEATHER',
      title: 'Heavy Hailstorm Causing Tin Roof Collapse at Cattle Shed',
      description: 'Severe squall line brought golf-ball-sized hail. 6 cattle injured, roof framing collapsed. Animal husbandry rescue team notified.',
      affectedPeople: 4,
      medicalAssistanceRequired: false,
      peopleTrapped: false,
      severity: 'LOW',
      locationDescription: 'Near Alandi Phata, Bhosari Outer',
      latitude: 18.6385,
      longitude: 73.8612,
      region: 'Pimpri-Chinchwad',
      status: 'RESOLVED',
      assignedOperatorId: operator2.id,
      createdAt: new Date(Date.now() - 36 * 3600 * 1000),
      resolvedAt: new Date(Date.now() - 30 * 3600 * 1000),
    },
    {
      clientIncidentId: 'inc-pune-demo-015',
      reporterId: citizen1.id,
      disasterType: 'OTHER',
      title: 'Suspected Hazardous Liquid Tanker Leakage on Highway',
      description: 'Strong ammonia-like smell from overturn tanker on highway bypass. Traffic diverted. NDRF CBRN advisory alerted.',
      affectedPeople: 50,
      medicalAssistanceRequired: true,
      peopleTrapped: false,
      severity: 'HIGH',
      locationDescription: 'Navale Bridge Junction, Katraj-Dehu Road Bypass, Pune City',
      latitude: 18.4592,
      longitude: 73.8291,
      region: 'Pune City',
      status: 'PENDING_REVIEW',
      assignedOperatorId: null,
      createdAt: new Date(Date.now() - 20 * 60 * 1000), // 20 mins ago
    },
    {
      clientIncidentId: 'inc-pune-demo-016',
      reporterId: citizen2.id,
      disasterType: 'MEDICAL_EMERGENCY',
      title: 'Heart Attack Patient Trapped in High-Rise Grid Failure',
      description: 'Elevator power bank burned out. Patient on 14th floor requires stretcher team with stair-chair evacuation.',
      affectedPeople: 1,
      medicalAssistanceRequired: true,
      peopleTrapped: true,
      severity: 'CRITICAL',
      locationDescription: 'Skyi Songbirds, Bhugaon-Bavdhan Road',
      latitude: 18.5089,
      longitude: 73.7485,
      region: 'Pune City',
      status: 'ACKNOWLEDGED',
      assignedOperatorId: operator1.id,
      createdAt: new Date(Date.now() - 50 * 60 * 1000),
    },
    {
      clientIncidentId: 'inc-pune-demo-017',
      reporterId: citizen1.id,
      disasterType: 'FIRE',
      title: 'Vegetation Bushfire Approaching Residential Enclave',
      description: 'Dry grass fire on hill slope spreading towards society perimeter wall with shifting winds. Forest guards and civic fire trucks en route.',
      affectedPeople: 80,
      medicalAssistanceRequired: false,
      peopleTrapped: false,
      severity: 'HIGH',
      locationDescription: 'Vetal Tekdi Ridge, Near MIT College Road, Kothrud',
      latitude: 18.5283,
      longitude: 73.8198,
      region: 'Pune City',
      status: 'IN_PROGRESS',
      assignedOperatorId: operator2.id,
      createdAt: new Date(Date.now() - 2.5 * 3600 * 1000),
    },
    {
      clientIncidentId: 'inc-pune-demo-018',
      reporterId: citizen2.id,
      disasterType: 'OTHER',
      title: 'Citizen Query: Water Logging Inquiry (Non-Emergency)',
      description: 'Caller asking for road status update regarding evening commute. No danger or distress present.',
      affectedPeople: 1,
      medicalAssistanceRequired: false,
      peopleTrapped: false,
      severity: 'LOW',
      locationDescription: 'Near Pune Station, Sangamwadi',
      latitude: 18.5289,
      longitude: 73.8744,
      region: 'Pune City',
      status: 'CANCELLED',
      assignedOperatorId: operator1.id,
      createdAt: new Date(Date.now() - 10 * 3600 * 1000),
      resolvedAt: new Date(Date.now() - 9.5 * 3600 * 1000),
    },
  ];

  for (const incData of sampleIncidents) {
    const existing = await prisma.incident.findUnique({
      where: { clientIncidentId: incData.clientIncidentId },
    });

    if (!existing) {
      const incident = await prisma.incident.create({
        data: {
          clientIncidentId: incData.clientIncidentId,
          reporterId: incData.reporterId,
          disasterType: incData.disasterType,
          title: incData.title,
          description: incData.description,
          affectedPeople: incData.affectedPeople,
          medicalAssistanceRequired: incData.medicalAssistanceRequired,
          peopleTrapped: incData.peopleTrapped,
          severity: incData.severity,
          locationDescription: incData.locationDescription,
          latitude: incData.latitude,
          longitude: incData.longitude,
          region: incData.region,
          status: incData.status,
          assignedOperatorId: incData.assignedOperatorId,
          createdAt: incData.createdAt,
          serverReceivedAt: new Date(incData.createdAt.getTime() + 1500),
          resolvedAt: incData.resolvedAt || null,
        },
      });

      // Status history entry
      await prisma.incidentStatusHistory.create({
        data: {
          incidentId: incident.id,
          previousStatus: null,
          newStatus: 'PENDING_REVIEW',
          changedById: incData.reporterId,
          note: 'Initial emergency report created by citizen.',
          createdAt: incident.createdAt,
        },
      });

      if (incData.status !== 'PENDING_REVIEW') {
        await prisma.incidentStatusHistory.create({
          data: {
            incidentId: incident.id,
            previousStatus: 'PENDING_REVIEW',
            newStatus: incData.status,
            changedById: incData.assignedOperatorId || operator1.id,
            note: `Status updated to ${incData.status} during rescue triage.`,
            createdAt: new Date(incData.createdAt.getTime() + 15 * 60 * 1000),
          },
        });
      }

      // Add a sample note for active critical incidents
      if (incData.severity === 'CRITICAL') {
        await prisma.incidentNote.create({
          data: {
            incidentId: incident.id,
            authorId: operator1.id,
            note: 'Rescue Team Bravo dispatched with inflatable raft and paramedic kit.',
            createdAt: new Date(incData.createdAt.getTime() + 20 * 60 * 1000),
          },
        });
      }

      // Audit log
      await prisma.auditLog.create({
        data: {
          actorId: incData.reporterId,
          action: 'INCIDENT_SUBMISSION',
          entityType: 'Incident',
          entityId: incident.id,
          metadata: JSON.stringify({
            clientIncidentId: incData.clientIncidentId,
            severity: incData.severity,
            region: incData.region,
          }),
          createdAt: incident.serverReceivedAt,
        },
      });
    }
  }

  console.log(`✓ Seeded ${sampleIncidents.length} demonstration incidents across Pune.`);
  console.log('--- Database seeding completed successfully! ---');
}

main()
  .catch((e) => {
    console.error('Error during database seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
