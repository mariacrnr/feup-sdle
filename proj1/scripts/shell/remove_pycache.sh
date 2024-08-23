echo "Deleting all pycache files and folders..."
find . -type d -name 'pycache' -delete
find . -type d -name 'pycache' -exec rmdir {} \;
echo "Finish deleting pycache files and folders."