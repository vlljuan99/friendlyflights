'use strict';
/*
  fli.js — primary flight-price provider.

  Wraps the `fli` Python library (https://github.com/punitarani/fli), which
  reads Google Flights directly. Chosen over SearchAPI because it's free
  (no API key, no $40/mo minimum) while returning the same Google Flights
  data, typically in ~1–2 s per route.

  We shell out to fli_search.py (which prints normalized JSON on stdout)
  rather than binding Python in-process, keeping the Node server simple and
  isolating any provider crash to a child process.

  Set PYTHON_BIN in .env if `python` is not the right interpreter on PATH.
*/

const { spawn } = require('child_process');
const path      = require('path');

const SCRIPT  = path.join(__dirname, 'fli_search.py');
const TIMEOUT = 30000;   // ms — kill a stuck search

// Returns an array of normalized flight objects (unranked), or [] on failure.
function searchFli(origin, dest, date) {
  return new Promise(resolve => {
    const pythonBin = process.env.PYTHON_BIN || 'python';
    console.log(`[fli] ${origin}→${dest} ${date}`);

    let child;
    try {
      child = spawn(pythonBin, [SCRIPT, origin, dest, date], { timeout: TIMEOUT });
    } catch (e) {
      console.warn(`[fli] spawn failed: ${e.message}`);
      return resolve([]);
    }

    let out = '', err = '';
    child.stdout.on('data', d => { out += d; });
    child.stderr.on('data', d => { err += d; });

    child.on('error', e => {
      console.warn(`[fli] process error: ${e.message}`);
      resolve([]);
    });

    child.on('close', code => {
      if (code !== 0) {
        console.warn(`[fli] exited ${code}: ${err.trim().slice(0, 200)}`);
        return resolve([]);
      }
      try {
        // Parse the LAST JSON line in case anything leaks onto stdout first.
        const line = out.trim().split('\n').filter(Boolean).pop() || '{}';
        const data = JSON.parse(line);
        if (data.error) {
          console.warn(`[fli] ${data.error}`);
          return resolve(data.flights || []);
        }
        const flights = data.flights || [];
        console.log(`[fli] ✓ ${flights.length} flights for ${origin}→${dest}`);
        resolve(flights);
      } catch (e) {
        console.warn(`[fli] parse error: ${e.message} | out: ${out.slice(0, 150)}`);
        resolve([]);
      }
    });
  });
}

module.exports = { searchFli };
