#!/bin/bash
cd /home/user/webapp
npm run dev -- --host 0.0.0.0 --port 3000 > /tmp/vite.log 2>&1 &
echo $! > /tmp/vite.pid
sleep 5
cat /tmp/vite.log
