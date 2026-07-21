## Plan: Fix free book downloads

I confirmed the free book record points to `ebook-files/noahs-rainbow-promises.pdf`, while the actual storage object exists as `noahs-rainbow-promises.pdf`. The app now strips the bucket prefix correctly, but free downloads still fail because storage access currently only allows admins or users with completed orders. Free resources do not create completed orders, so normal logged-in users cannot generate/read the signed link.

### Changes to make

1. **Add backend support for free downloads**
   - Create or extend a download-link function that validates:
     - the user is logged in
     - the ebook exists and is approved
     - the ebook is free (`price = 0`) or belongs to a completed purchase
   - Generate the signed storage URL server-side with elevated backend permissions so free resources do not depend on purchase rows.

2. **Update the free download button**
   - In `EbookDetail.tsx`, replace direct client-side `storage.createSignedUrl(...)` with the backend function call.
   - Keep the current fetch-to-blob download behavior so browser/ad-blocker issues do not open the blocked storage domain page.

3. **Preserve paid-book security**
   - Do not make the private ebook bucket public.
   - Paid books still require a completed purchase before a link is returned.
   - Free resources still require a logged-in account, matching the app’s account-based library model.

4. **Improve error messaging**
   - Show a clearer message when the file is missing from storage versus when the user lacks access.
   - Log enough detail in the backend function to debug future missing-file issues without exposing keys.

5. **Verify**
   - Test the free book button on `Noah's Rainbow Promises` while logged in.
   - Confirm the signed link resolves and the PDF download starts.