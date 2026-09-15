import { db } from '../server/db';
import { User, JobCard } from '../src/types';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ FAILED: ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  }
  console.log(`  ✓ ${message}`);
}

function makeValidCardData(extra?: Partial<JobCard>): Partial<JobCard> {
  return {
    customerName: 'Tata Steel Tubes Division',
    customerId: 'cust-1',
    equipmentName: 'Boiler Feed Pump #3',
    equipmentId: 'eq-1',
    serviceType: 'Preventive Maintenance',
    priority: 'Medium',
    workPerformed: 'Completed full mechanical seal replacement and alignment verification under load.',
    checklist: [
      { id: 'chk-1', code: 'CHK-M-01', label: 'Inspect mechanical seal', category: 'Mechanical', status: 'Completed' },
      { id: 'chk-2', code: 'CHK-E-01', label: 'Measure motor insulation', category: 'Electrical', status: 'Completed' },
    ],
    customerSignOff: {
      signeeName: 'A. K. Sharma',
      signatureDate: '2026-03-30',
      isConfirmed: true,
      signatureDataUrl: 'data:image/svg+xml;utf8,<svg></svg>',
    },
    ...extra,
  };
}

async function runSprint1Verification() {
  console.log('\n======================================================');
  console.log('🧪 RUNNING FOCUSED VERIFICATION: SPRINT 1 WORK');
  console.log('======================================================\n');

  const engineer1 = db.getUserById('usr-eng-1')!;
  const engineer2 = db.getUserById('usr-eng-4')!;
  const manager1 = db.getUserById('usr-mgr-1')!;
  const manager2 = db.getUserById('usr-mgr-2')!;

  assert(!!engineer1 && !!engineer2 && !!manager1 && !!manager2, 'Pre-seeded test actors exist');

  // ----------------------------------------------------
  // VERIFICATION 1: Lifecycle transitions work correctly
  // ----------------------------------------------------
  console.log('\nTest 1: Job Card Lifecycle Transitions');
  const created = db.createJobCard(engineer1, makeValidCardData());
  assert(created.status === 201 && !!created.card, 'Engineer 1 can create new Job Card in Draft');
  const cardId = created.card!.id;
  assert(created.card!.status === 'Draft', 'Initial status is Draft');

  // Engineer 1 submits draft -> Pending Review
  const submitRes = db.submitJobCard(engineer1, cardId);
  assert(submitRes.status === 200, 'Draft transitions to Pending Review upon submission (HTTP 200)');
  const submittedCard = db.getScopedJobCard(engineer1, cardId).card;
  assert(submittedCard?.status === 'Pending Review', 'Card status is Pending Review');

  // Manager 1 requests changes -> Changes Requested
  const reqRes = db.requestChanges(manager1, cardId, ['Work Performed'], 'Please provide recorded alignment vibration values.');
  assert(reqRes.status === 200, 'Manager 1 can request changes with sections and notes (HTTP 200)');
  const changesReqCard = db.getScopedJobCard(manager1, cardId).card;
  assert(changesReqCard?.status === 'Changes Requested', 'Card status transitioned to Changes Requested');

  // Engineer 1 resubmits -> Resubmitted
  const resubmitRes = db.submitJobCard(engineer1, cardId);
  assert(resubmitRes.status === 200, 'Engineer 1 can resubmit card after addressing changes (HTTP 200)');
  const resubmittedCard = db.getScopedJobCard(engineer1, cardId).card;
  assert(resubmittedCard?.status === 'Resubmitted', 'Card status transitioned to Resubmitted');

  // Manager 1 approves -> Approved
  const approveRes = db.approveJobCard(manager1, cardId, 'Vibration verified at 1.8 mm/s RMS. Approved.');
  assert(approveRes.status === 200, 'Manager 1 can approve resubmitted card (HTTP 200)');
  const approvedCard = db.getScopedJobCard(manager1, cardId).card;
  assert(approvedCard?.status === 'Approved', 'Card status is Approved');

  // Illegal transition: Cannot request changes on an Approved card
  const illegalReq = db.requestChanges(manager1, cardId, ['Parts'], 'Too late');
  assert(illegalReq.status === 400, 'Illegal transition: requestChanges on Approved card fails (HTTP 400)');

  // ----------------------------------------------------
  // VERIFICATION 2: Pending Review, Approved, and Rejected cards cannot be edited by engineers
  // ----------------------------------------------------
  console.log('\nTest 2: Pending Review, Approved, and Rejected cards cannot be edited by engineers');
  
  // 2a. Attempt edit on Approved card
  const editApproved = db.updateJobCard(engineer1, cardId, { workPerformed: 'Tamper with approved card' });
  assert(editApproved.status === 403, 'Engineer editing Approved card is blocked (HTTP 403)');

  // 2b. Card in Pending Review
  const cardPending = db.createJobCard(engineer1, makeValidCardData({ customerName: 'Jindal Power Plant' })).card!;
  const subPending = db.submitJobCard(engineer1, cardPending.id);
  assert(subPending.status === 200, 'Card transitioned into Pending Review successfully');
  const editPending = db.updateJobCard(engineer1, cardPending.id, { workPerformed: 'Tamper during review' });
  assert(editPending.status === 403, 'Engineer editing Pending Review card is blocked (HTTP 403)');

  // 2c. Card in Rejected
  const rejResult = db.rejectJobCard(manager1, cardPending.id, 'Invalid documentation submitted', 'Commercial Contract Issue');
  assert(rejResult.status === 200, 'Manager rejected the pending card');
  const rejectedCard = db.getScopedJobCard(engineer1, cardPending.id).card!;
  assert(rejectedCard.status === 'Rejected', 'Card is in terminal Rejected status');
  const editRejected = db.updateJobCard(engineer1, cardPending.id, { workPerformed: 'Tamper with rejected card' });
  assert(editRejected.status === 403, 'Engineer editing Rejected card is blocked (HTTP 403)');

  // 2d. Engineer CAN edit Draft card
  const draftCard = db.createJobCard(engineer1, { customerName: 'Draft Test' }).card!;
  const editDraft = db.updateJobCard(engineer1, draftCard.id, { workPerformed: 'Valid draft work' });
  assert(editDraft.status === 200, 'Engineer CAN edit Draft card (HTTP 200)');

  // ----------------------------------------------------
  // VERIFICATION 3: Request Changes requires affected sections and feedback
  // ----------------------------------------------------
  console.log('\nTest 3: Request Changes requires affected sections and feedback');
  const cardForReq = db.createJobCard(engineer1, makeValidCardData({ customerName: 'Vedanta Smelter' })).card!;
  db.submitJobCard(engineer1, cardForReq.id);

  // Missing sections
  const reqNoSections = db.requestChanges(manager1, cardForReq.id, [], 'Needs rework');
  assert(reqNoSections.status === 400, 'Request Changes with empty sections is rejected (HTTP 400)');

  // Missing feedback notes
  const reqNoNotes = db.requestChanges(manager1, cardForReq.id, ['Inspection Checklist'], '   ');
  assert(reqNoNotes.status === 400, 'Request Changes with blank feedback is rejected (HTTP 400)');

  // Valid request
  const reqValid = db.requestChanges(manager1, cardForReq.id, ['Inspection Checklist', 'Photographic Evidence'], 'Upload after-service photo and log pressure.');
  assert(reqValid.status === 200, 'Request Changes with valid sections and feedback succeeds (HTTP 200)');

  // ----------------------------------------------------
  // VERIFICATION 4: Rejection requires a justification code and explanation
  // ----------------------------------------------------
  console.log('\nTest 4: Rejection requires a justification code and explanation');
  const cardForRej = db.createJobCard(engineer1, makeValidCardData({ customerName: 'NTPC Super Thermal' })).card!;
  db.submitJobCard(engineer1, cardForRej.id);

  // Missing justification code
  const rejNoCode = db.rejectJobCard(manager1, cardForRej.id, 'Detailed explanation here', '');
  assert(rejNoCode.status === 400, 'Rejection with empty justification code fails (HTTP 400)');

  // Missing explanation
  const rejNoReason = db.rejectJobCard(manager1, cardForRej.id, '   ', 'Duplicate Job Card');
  assert(rejNoReason.status === 400, 'Rejection with blank explanation fails (HTTP 400)');

  // Valid rejection
  const rejValid = db.rejectJobCard(
    manager1,
    cardForRej.id,
    'Contract cancelled due to warranty terms dispute with client.',
    'Commercial Contract Issue'
  );
  assert(rejValid.status === 200, 'Rejection with code and explanation succeeds (HTTP 200)');
  const postRejCard = db.getScopedJobCard(manager1, cardForRej.id).card!;
  assert(postRejCard.status === 'Rejected', 'Card is terminal Rejected');

  // ----------------------------------------------------
  // VERIFICATION 5: Resubmission returns same job card to manager review queue
  // ----------------------------------------------------
  console.log('\nTest 5: Resubmission returns the same job card to manager review queue');
  const cardForResub = db.createJobCard(engineer1, makeValidCardData({ customerName: 'Adani Solar Plant' })).card!;
  db.submitJobCard(engineer1, cardForResub.id);
  db.requestChanges(manager1, cardForResub.id, ['Parts & Materials'], 'Include warehouse stock lot number.');

  // Engineer resubmits
  const resubRes = db.submitJobCard(engineer1, cardForResub.id);
  assert(resubRes.status === 200, 'Engineer resubmits card');
  assert(resubRes.card?.id === cardForResub.id, 'Same Job Card ID is retained');
  assert(resubRes.card?.status === 'Resubmitted', 'Status is Resubmitted');

  // Verify Manager review queue contains card
  const mgrQueue = db.getScopedJobCards(manager1);
  const foundInQueue = mgrQueue.some((c) => c.id === cardForResub.id && c.status === 'Resubmitted');
  assert(foundInQueue, 'Job Card appears in Manager review queue with status Resubmitted');

  // ----------------------------------------------------
  // VERIFICATION 6: Revision history records actor, timestamp, state transition, feedback, affected sections
  // ----------------------------------------------------
  console.log('\nTest 6: Revision history records actor, timestamp, state transition, feedback, affected sections');
  const auditCard = db.getScopedJobCard(manager1, cardForResub.id).card!;
  assert(auditCard.revisions !== undefined && auditCard.revisions.length >= 3, 'Card contains revision audit trail');

  const reqChangeRev = auditCard.revisions.find((r) => r.action === 'Changes Requested');
  assert(reqChangeRev !== undefined, 'Found Changes Requested audit record');
  assert(!!reqChangeRev!.actorId, `Recorded actorId: ${reqChangeRev!.actorId}`);
  assert(reqChangeRev!.actorRole === manager1.role, `Recorded actorRole: ${reqChangeRev!.actorRole}`);
  assert(!!reqChangeRev!.timestamp, `Recorded timestamp: ${reqChangeRev!.timestamp}`);
  assert(reqChangeRev!.previousState === 'Pending Review', `Recorded previousState: ${reqChangeRev!.previousState}`);
  assert(reqChangeRev!.newState === 'Changes Requested', `Recorded newState: ${reqChangeRev!.newState}`);
  assert(reqChangeRev!.affectedSections?.includes('Parts & Materials') === true, 'Recorded affectedSections');
  assert(reqChangeRev!.managerFeedback?.includes('warehouse stock lot number') === true, 'Recorded managerFeedback');

  // ----------------------------------------------------
  // VERIFICATION 7: Managers cannot access job cards outside their assigned teams
  // ----------------------------------------------------
  console.log('\nTest 7: Managers cannot access job cards outside their assigned teams');
  // Create card for engineer 2 (managed by manager 2)
  const team2Card = db.createJobCard(engineer2, makeValidCardData({
    customerName: 'West Coast Petrochem',
  })).card!;

  // Manager 1 (Team North) tries to read Team West card
  const mgr1Read = db.getScopedJobCard(manager1, team2Card.id);
  assert(mgr1Read.status === 403, 'Manager 1 reading Team West card returns 403 Forbidden');

  // Manager 1 tries to approve Team West card
  const mgr1Approve = db.approveJobCard(manager1, team2Card.id, 'Unauthorized approval');
  assert(mgr1Approve.status === 403, 'Manager 1 approving Team West card returns 403 Forbidden');

  // Manager 1 scoped list does not contain team2Card
  const mgr1Cards = db.getScopedJobCards(manager1);
  assert(!mgr1Cards.some((c) => c.id === team2Card.id), 'Manager 1 scoped job list excludes Team West cards');

  // Manager 2 scoped list contains team2Card
  const mgr2Cards = db.getScopedJobCards(manager2);
  assert(mgr2Cards.some((c) => c.id === team2Card.id), 'Manager 2 scoped job list includes Team West card');

  // ----------------------------------------------------
  // VERIFICATION 8: Engineers cannot access other engineers' job cards
  // ----------------------------------------------------
  console.log('\nTest 8: Engineers cannot access other engineers job cards');
  // Engineer 1 tries to read Engineer 2 card
  const eng1Read = db.getScopedJobCard(engineer1, team2Card.id);
  assert(eng1Read.status === 403, 'Engineer 1 reading Engineer 2 card returns 403 Forbidden');

  // Engineer 1 tries to edit Engineer 2 card
  const eng1Edit = db.updateJobCard(engineer1, team2Card.id, { workPerformed: 'Cross-engineer edit attempt' });
  assert(eng1Edit.status === 403, 'Engineer 1 editing Engineer 2 card returns 403 Forbidden');

  // Engineer 1 scoped list excludes Engineer 2 card
  const eng1Cards = db.getScopedJobCards(engineer1);
  assert(!eng1Cards.some((c) => c.id === team2Card.id), 'Engineer 1 scoped list excludes other engineers cards');

  // ----------------------------------------------------
  // VERIFICATION SUMMARY
  // ----------------------------------------------------
  console.log('\n======================================================');
  console.log('✅ ALL 8 SYSTEM VERIFICATION TESTS PASSED (100% GREEN)');
  console.log('======================================================\n');
}

runSprint1Verification().catch((err) => {
  console.error('\nVerification failed with error:', err);
  process.exit(1);
});
