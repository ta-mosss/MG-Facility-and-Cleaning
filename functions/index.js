// functions/index.js
const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

// Auto-assign team on ticket creation
exports.autoAssignTeam = functions.firestore
  .document('mgfc_tickets/{ticketId}')
  .onCreate(async (snap, context) => {
    const ticket = snap.data();
    if (ticket.assignedTeam) return; // already assigned

    const teams = ['Team Alpha', 'Team Bravo', 'Team Charlie'];
    const snapshot = await admin.firestore().collection('mgfc_tickets')
      .where('assignedTeam', '!=', null)
      .get();
    const count = snapshot.size;
    const assignedTeam = teams[count % teams.length];
    await snap.ref.update({ assignedTeam, status: 'scheduled' });
    // Send notification to management (via WhatsApp/email)
    // ...
  });

// Update staff performance on sign-off
exports.updateStaffPerformance = functions.firestore
  .document('mgfc_signoffs/{signoffId}')
  .onCreate(async (snap, context) => {
    const signoff = snap.data();
    const { team, nps, csat, ces } = signoff;
    // Update team averages (store in a `mgfc_team_performance` collection)
    const teamRef = admin.firestore().collection('mgfc_team_performance').doc(team);
    await teamRef.set({
      totalNps: admin.firestore.FieldValue.increment(nps || 0),
      count: admin.firestore.FieldValue.increment(1),
      // ... compute avg on read
    }, { merge: true });
  });

// Auto-create invoice on job completion (optional)
exports.createInvoiceOnCompletion = functions.firestore
  .document('mgfc_jobs/{jobId}')
  .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();
    if (before.status !== 'in-progress' && after.status === 'completed') {
      // Create a draft invoice in mgfc_invoices
      // ...
    }
  });
