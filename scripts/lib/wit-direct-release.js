module.exports=function directRelease(flows){
 const action=flows.find(n=>n.id==='esswitaudi_stop1');
 action.action='growatt_modbus.write_registers';action.domain='growatt_modbus';action.service='write_registers';
 action.data=`($c := $flowContext('ess_system_config'); $s := $flowContext('ess_wit_control_readback'); $assert(payload.releaseStep in ['authority','remote'], 'Ongeldige WIT-vrijgavestap'); $assert($exists($s.deviceId) and $type($s.deviceId)='string' and $length($s.deviceId)>0 and $millis()-$s.at>=0 and $millis()-$s.at<=120000, 'Verse WIT-terugmelding ontbreekt'); $assert($s.remoteEntity=$lookup($c.entities,'select.growatt_grid_remote_power_control_enable') and $s.authorityEntity=$lookup($c.entities,'select.growatt_grid_control_authority'), 'WIT doelentiteit ontbreekt'); {"device_id":$s.deviceId,"register":payload.releaseStep='authority'?30100:30407,"values":[0]})`;
};
