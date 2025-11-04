using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Infrastructure.Data;
using DeviceManagementSolution.Domain.Entities;

namespace Devicemanagement.Controllers
{
    [Authorize(Roles = "Admin,User")]
    [Route("api/[controller]")]
    [ApiController]
    public class ModbusConfigurationController : ControllerBase
    {
        private readonly DeviceDbContext _context;

        public ModbusConfigurationController(DeviceDbContext context)
        {
            _context = context;
        }

        // POST: api/ModbusConfiguration
        [HttpPost]
        public async Task<IActionResult> AddConfiguration(ModbusConfiguration config)
        {
            var device = await _context.Devices.FindAsync(config.DeviceId);
            if (device == null)
                return NotFound($"Device with ID {config.DeviceId} not found.");

            var existing = await _context.ModbusConfigurations
                .FirstOrDefaultAsync(c => c.DeviceId == config.DeviceId);
            if (existing != null)
                return BadRequest("Configuration for this device already exists.");

            _context.ModbusConfigurations.Add(config);
            device.IsConfigured = true;
            _context.Entry(device).State = EntityState.Modified;

            await _context.SaveChangesAsync();

            return Ok(new { message = "Configuration added successfully", data = config });
        }

        // GET: api/ModbusConfiguration/{deviceId}
        [HttpGet("{deviceId}")]
        public async Task<IActionResult> GetByDeviceId(int deviceId)
        {
            var config = await _context.ModbusConfigurations
                .FirstOrDefaultAsync(c => c.DeviceId == deviceId);

            if (config == null)
                return NotFound("Configuration not found for this device.");

            return Ok(config);
        }

        // PUT: api/ModbusConfiguration/{deviceId}
        [HttpPut("{deviceId}")]
        public async Task<IActionResult> UpdateConfiguration(int deviceId, ModbusConfiguration updatedConfig)
        {
            var config = await _context.ModbusConfigurations
                .FirstOrDefaultAsync(c => c.DeviceId == deviceId);

            if (config == null)
                return NotFound("Configuration not found for this device.");

            config.BaudRate = updatedConfig.BaudRate;
            config.Parity = updatedConfig.Parity;
            config.DataBits = updatedConfig.DataBits;
            config.StopBits = updatedConfig.StopBits;
            config.PortName = updatedConfig.PortName;
            config.RegisterAddress = updatedConfig.RegisterAddress;

            await _context.SaveChangesAsync();
            return Ok(new { message = "Configuration updated successfully", data = config });
        }
    }
}
