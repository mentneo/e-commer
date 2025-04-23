# Firebase Index Setup

To fix the query errors, you need to create the following Firebase Firestore indexes:

## Required Indexes

1. **Orders Collection Index**:
   - Visit this URL to create the index: [Create Orders Index](https://console.firebase.google.com/v1/r/project/ecommer-3efa3/firestore/indexes?create_composite=Ckxwcm9qZWN0cy9lY29tbWVyLTNlZmEzL2RhdGFiYXNlcy8oZGVmYXVsdCkvY29sbGVjdGlvbkdyb3Vwcy9vcmRlcnMvaW5kZXhlcy9fEAEaCgoGdXNlcklkEAEaDQoJY3JlYXRlZEF0EAIaDAoIX19uYW1lX18QAg)
   - Or manually create a composite index for:
     - Collection: `orders`
     - Fields to index: 
       - `userId` Ascending
       - `createdAt` Descending

2. **Users Collection Index**:
   - Visit this URL to create the index: [Create Users Index](https://console.firebase.google.com/v1/r/project/ecommer-3efa3/firestore/indexes?create_composite=Cktwcm9qZWN0cy9lY29tbWVyLTNlZmEzL2RhdGFiYXNlcy8oZGVmYXVsdCkvY29sbGVjdGlvbkdyb3Vwcy91c2Vycy9pbmRleGVzL18QARoICgRyb2xlEAEaDQoJY3JlYXRlZEF0EAIaDAoIX19uYW1lX18QAg)
   - Or manually create a composite index for:
     - Collection: `users`
     - Fields to index:
       - `role` Ascending
       - `createdAt` Descending

## How to Create Indexes Manually:

1. Go to the Firebase Console
2. Select your project
3. Go to Firestore Database
4. Click on the "Indexes" tab
5. Click "Create Index"
6. Select the appropriate collection
7. Add the fields as mentioned above with the correct order
8. Click "Create"

After creating the indexes, it might take a few minutes for them to be active.
