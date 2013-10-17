/**
 * ain2 module for writing to syslog
 *
 * 0  emerg    Emergency: system is unusable
 * 1  alert    Alert: action must be taken immediately
 * 2  crit     Critical: critical conditions
 * 3  err      Error: error conditions
 * 4  warn     Warning: warning conditions
 * 5  notice   Notice: normal but significant condition
 * 6  info     Informational: informational messages
 * 7  debug    Debug: debug-level messages
 *
 *
 * Facilities
 *  0  kern    kernel messages
 *  1  user    user-level messages
 *  2  mail    mail system
 *  3  daemon  system daemons
 *  4  auth    security/authorization messages
 *  5  syslog  messages generated internally by syslog daemon
 *  6  lpr     line printer subsystem
 *  7  news    network news subsystem
 *  8  uucp    UUCP subsystem
 *  16  local0  local use 0
 *  17  local1  local use 1
 *  18  local2  local use 2
 *  19  local3  local use 3
 *  20  local4  local use 4
 *  21  local5  local use 5
 *  22  local6  local use 6
 *  23  local7  local use 7
 * @type {SysLogger|exports|*}
 */
var SysLogger   = require('ain2')
  , util        = require('util')
  , log         = {}
  , metalogger  = require('../metalogger');

var _level      = 'debug'
  , _facility   = 'local0'
  , _app_name   = 'app_name';

var levels = {'debug':7, 'info':6, 'notice':5, 'warning':4, 'error':3, 'critical':2, 'alert':1, 'emergency':0};

exports = module.exports = function(level) {


  var logger = {}
    , options = {
      facility: _facility,
      tag:      _app_name
    };

  if ('NODE_LOGGER_FACILITY' in process.env && process.env.NODE_LOGGER_FACILITY) {
    options.facility = process.env.NODE_LOGGER_FACILITY;
  }

  if ('NODE_LOGGER_APPNAME' in process.env && process.env.NODE_LOGGER_APPNAME) {
    options.tag = process.env.NODE_LOGGER_APPNAME;
  }

  if (level in levels) _level = level;

  log = new SysLogger(options);

  for(var level in levels) {
    logger[level] = (function(level, arguments){
      return function(){
        delegate(level, arguments)
      }
    })(level, arguments);
  }

  return logger;
}

function delegate(method, _args) {

  var call_position = metalogger.callposition();

  if (!metalogger.logLevelAllowedGranular(method)) {
    if (!metalogger.logLevelAllowed(method, _level)) {
      return;
    }
  }

  var args = Array.prototype.slice.call(_args);

  var message = [call_position];
  if(args.length === 1) {
    message.push(util.inspect(args[0], { showHidden: true, depth: null }));
  }

  if(args.length === 2) {
    message.push(args.shift());
    message.push(util.inspect(args[0], { showHidden: true, depth: null }));
  }

  if(args.length > 2) {
    message.push(args.shift());
    message.push(util.format.apply(null, args));
  }

  log.send(message.join(' '), levels[method]);
}