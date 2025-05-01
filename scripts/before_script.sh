node -v
if [ "$CI_JOB_STAGE" == "check-format" ]; then
    npm run install:dev
else
    npm pkg delete scripts.prepare
    npm run install:prod
    npx playwright install
fi
