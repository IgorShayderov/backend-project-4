#!/usr/bin/env node

import { Command } from 'commander';
import pageLoader from '../src/index.js';

const program = new Command();

program
  .name('page-loader')
  .description('Page loader utility')
  .version('1.0.0')
  .argument('url')
  .option('-o, --output [dir]', 'output directory')
  .action((url, options) => {
    pageLoader(url, options);
  });

program.parse();
