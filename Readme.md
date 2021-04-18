# Rentee Backend

## To run the project: 

* create *.env* file and add these env variables: 
    - `DB=reminder`
    - `DB_USER_NAME=root`
    - `DB_PASSWORD=root`
* Run **yarn** in cmd (to install all dependencies).
* Run **yarn dev** to run the development server.
* Run **yarn build** to build the project before committing any changes.
* Run **yarn prettier:fix** to fix if build fails due to any code-style issues.

---

## Development flow:

1. Make changes in the required files
2. git add <only those files which are changed>
3. git commit "proper commit message no matter how long it goes, it should explain what is done in this commit"
4. git pull origin master (make sure you are on sync with the remote)
5. if conflict arise, resolve those conflicts and again repeat from step 2.
6. if no conflict is there, do:
    git pull origin master (make sure you are on sync with master remote)
    repeat from step 5
7. git push origin dev
8. open PR from dev to master. 
9. once PR is merged into master, do:
    git pull origin master (in your local to keep sync with master)