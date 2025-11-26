# Quick Start: Running the Checkpoint System

## Prerequisites
- Node.js backend running on `http://localhost:5000`
- React frontend running
- MySQL database connected

## Step 1: Run Database Migration
```bash
mysql -u root -p your_database < backend/sql/add_checkpoint_data.sql
```

Or manually execute in MySQL client:
```sql
ALTER TABLE `activity_submissions` ADD COLUMN `checkpoint_data` JSON DEFAULT NULL AFTER `feedback`;
```

## Step 2: Test the Feature

### As a Student:
1. Navigate to a class
2. Open the "SimPC" activity (PC Building Simulator)
3. You should see:
   - Progress bar at the top showing "0%" initially
   - Individual component status below
   - The three scenes: CPU, CMOS, RAM

### Play and Save:
4. Click on "CPU" component
5. Complete the CPU assembly steps
6. When finished, the progress bar updates to "33%" (1/3 components)
7. Go back and repeat for CMOS and RAM

### Resume Test:
8. Refresh the page (F5)
9. Open the same SimPC activity again
10. Your previous progress is **restored**!
11. You can see which components were completed

### Submit:
12. Once all 3 components are complete (progress = 100%)
13. The "Submit Activity" button becomes enabled
14. Click Submit to finalize the activity
15. Checkpoint data is saved with the submission

## Understanding the Flow

```
┌─────────────────────────────────────────┐
│  Student Opens SimPC Activity           │
│  (SimPCActivityView.jsx)                │
└─────────────┬───────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────┐
│ Fetch saved checkpoints from backend    │
│ GET /activity/{id}/my-submission        │
└─────────────┬───────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────┐
│ Progress bar shows previous progress    │
│ (or 0% if first time)                   │
└─────────────┬───────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────┐
│ Student plays game (Phaser scenes)      │
│ (CpuScene, CmosScene, RamScene)         │
└─────────────┬───────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────┐
│ Component complete → emit checkpoint    │
│ this.onCheckpointComplete("cpu", 100)   │
└─────────────┬───────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────┐
│ Frontend saves to backend               │
│ POST /activity/{id}/checkpoint          │
│ Includes full checkpoint JSON           │
└─────────────┬───────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────┐
│ Backend updates activity_submissions    │
│ checkpoint_data column                  │
└─────────────┬───────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────┐
│ Progress bar updates (33%, 66%, 100%)   │
│ Individual component status shown       │
└─────────────┬───────────────────────────┘
              │
    When all components = 100%
              │
              ▼
┌─────────────────────────────────────────┐
│ Submit button becomes enabled           │
│ Click Submit Activity                   │
└─────────────┬───────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────┐
│ Final submission saved with             │
│ checkpoint_data to database             │
└─────────────────────────────────────────┘
```

## Key Files Modified

| File | Purpose |
|------|---------|
| `frontend/src/activities/simpc/SimPCActivityView.jsx` | Main container, checkpoint state management |
| `frontend/src/features/DragDrop/components/PhaserSimulator.jsx` | Game container, props for callbacks |
| `frontend/src/features/DragDrop/pages/CpuScene.jsx` | CPU assembly scene with checkpoint emit |
| `frontend/src/features/DragDrop/pages/CmosScene.jsx` | CMOS battery scene with checkpoint emit |
| `frontend/src/features/DragDrop/pages/RamScene.jsx` | RAM installation scene with checkpoint emit |
| `backend/routes/activity.routes.js` | New checkpoint save route |
| `backend/controllers/activity.controller.js` | New saveCheckpoint method |
| `backend/sql/add_checkpoint_data.sql` | Database migration |

## Checkpoint Data Format

```json
{
  "cpu": {
    "completed": true,
    "progress": 100,
    "timestamp": "2025-11-26T12:34:56.789Z"
  },
  "cmos": {
    "completed": true,
    "progress": 100,
    "timestamp": "2025-11-26T12:35:00.000Z"
  },
  "ram": {
    "completed": false,
    "progress": 0,
    "timestamp": null
  }
}
```

## Troubleshooting

### Progress not saving?
1. Check browser console for errors
2. Verify backend is running on port 5000
3. Check database connection in backend
4. Ensure checkpoint_data column was added to database

### Progress not loading on refresh?
1. Verify student is logged in (JWT token in localStorage)
2. Check network tab - GET /activity/{id}/my-submission should return 200
3. Check if checkpoint_data is actually in the response

### Submit button not enabling?
1. Ensure all 3 components show "✓" (completed)
2. Progress bar should show 100%
3. Check browser console for validation errors

## Database Query to Check Checkpoints

```sql
SELECT 
  submission_id,
  activity_id,
  student_id,
  checkpoint_data,
  submitted_at
FROM activity_submissions
WHERE checkpoint_data IS NOT NULL
ORDER BY submitted_at DESC;
```

## Architecture Benefits

✅ **User-Specific**: Each student's checkpoints isolated by JWT token  
✅ **Persistent**: Data survives page refreshes and session reloads  
✅ **Real-time Progress**: Progress bar updates instantly  
✅ **Resume Support**: Continue from where you left off  
✅ **Validated**: Must complete all components to submit  
✅ **Auditable**: Timestamps track when each component was completed  

---

## Questions?

If you need to:
- Add more components (GPU, SATA, PERI): Add entries to checkpoint state in SimPCActivityView
- Change progress thresholds: Modify the saveCheckpoint calls in scene files
- Add achievements/badges: Use the checkpoint_data from backend submissions
- Track time per component: Add duration calculation to checkpoint timestamps
