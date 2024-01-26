import axios from 'axios';
import axiosDebug from 'axios-debug-log';

const api = axios.create();

axiosDebug.addLogger(api);

export { api };
