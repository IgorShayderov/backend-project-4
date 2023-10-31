#!/usr/bin/env node

import { Command } from 'commander';
import hz from '../src/index.js';

const program = new Command();

program
  .name('page-loader')
  .description('Utility to load pages')
  .version('1.0.0')
  .argument('url')
  .option('-o, --output <folder>', 'output folder')
  .action((url, options) => {
    hz(url, options);
    console.log({ url }, { options });
  });
