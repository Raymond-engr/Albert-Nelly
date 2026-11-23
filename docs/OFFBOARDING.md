# Staff Offboarding Procedure

When a staff member departs Albert Nelly or their role changes such that Control Room access must be revoked:

## 1. Automated Offboarding (Recommended)

1. Sign into the Control Room as an **Owner**.
2. Navigate to **Team and permissions** (`/control-room/team`).
3. Click the offboard action or trigger `PATCH /api/control-room/team/:id/offboard`.
4. This endpoint atomically:
   - Verifies the staff member is not the last active Owner (rejecting with HTTP 422 if so).
   - Sets `staff.status = 'disabled'` in the database.
   - Preserves all historical records, foreign key associations (deals, leads, logs), and attribution.
   - Invokes the Supabase Auth Admin API (`updateUserById(id, { ban_duration: 'none' })`) to immediately invalidate active authentication sessions and prevent subsequent sign-ins.
   - Records an entry in the append-only `activity_log`.

## 2. Manual Emergency Offboarding (Direct Database / Supabase Dashboard)

If the Control Room is inaccessible or in case of an emergency credential revocation:

1. **Supabase Dashboard -> Authentication -> Users**:
   - Locate the target user by email.
   - Select **Ban user** (or set ban duration indefinitely). This invalidates active refresh tokens.
2. **Supabase Dashboard -> SQL Editor**:
   ```sql
   UPDATE public.staff
   SET status = 'disabled'
   WHERE id = '<USER_UUID>';
   ```
   *Note: Do not delete (`DELETE FROM staff WHERE id = ...`) the row, as foreign keys in `deals`, `leads`, and audit logs reference `staff.id`.*
3. Verify the user is unable to pass the MFA or server guard (`requireStaff` rejects status `disabled` with HTTP 403).
