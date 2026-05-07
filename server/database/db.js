/**
 * db.js - Database Entry Point
 */

const useLoconst useLocal = process.env.USE_SQLITE === 'true' || !!process.env.RAILWAY_ENVIRONMENT;

if (useLocal) {
        try {
                    const sqlite3 = require('sqlite3').verbose();
                    const path = require('path');
                    const fs = require('fs');

            const volumePath = (process.env.RAILWAY_ENVIRONMENT === 'true') ? '/data' : process.env.RAILWAY_VOLUME_MOUNT_PATH;
            
