
## Feature Proposals: Subscriptions, Publishers, and Beyond

Your ideas are excellent for turning the platform into a fully-fledged marketplace. Here is how we can implement your suggestions, along with a few other features that would pair well with them.

### 1. Author Subscriptions (Yearly Fee)
Instead of giving free unlimited access to authors, we can monetize the author side of the platform.
*   **How it works**: Admins can set a "Yearly Author Subscription Fee" in the Settings. When a user applies to be an author, they are prompted to pay this fee (via your existing Lenco integration) to activate their account for 365 days.
*   **Database Changes**: Add a `subscription_expires_at` column to the `profiles` table.
*   **UI Changes**: An "Upgrade to Author" checkout page. The Author Dashboard would show their subscription status and a prompt to renew if it's expiring soon.

### 2. Publisher Accounts & Copyright Checks
This is perfect for users who manage multiple authors or act as a digital publishing house.
*   **How it works**: We create a new `publisher` role. Publishers get an advanced dashboard where they can group their submissions by different "Author Names".
*   **Copyright Clearance**: When a publisher (or even a regular author) submits a book, we add a mandatory "Copyright Declaration" checkbox. We can also add an optional **"Rights Document"** file upload where they can attach their distribution agreement, giving the Admin legal peace of mind before approving.
*   **Database Changes**: Add `publisher` to the `app_role` enum. Add `copyright_document_url` to the `ebooks` table.

### 3. Automated Payouts & Platform Fees (Recommended addition)
Right now, the Author Dashboard shows total revenue based on the book price. But usually, the platform takes a cut.
*   **How it works**: Admin sets a "Platform Fee %" (e.g., 15%). The Author Dashboard calculates their *Net Earnings*.
*   **Payout System**: Authors get a "Wallet" tab where they can click "Request Payout" once they reach a minimum threshold. Admins get a "Payouts" tab to see who needs to be paid via Mobile Money.

### 4. Verified Buyer Reviews & Ratings (Recommended addition)
To boost sales, social proof is key.
*   **How it works**: Only users or guests who have successfully purchased a specific ebook can leave a 1-5 star review and a comment.
*   **UI Changes**: Star ratings on the Browse and Ebook Detail pages.

---

### Suggested Next Steps
We can tackle these one by one. I recommend starting with either:
**Option A:** Build the **Yearly Author Subscription** flow first so you can start monetizing author signups immediately.
**Option B:** Add the **Publisher Role & Copyright Document** upload to secure the submission process.

Let me know which feature you'd like to implement first!
