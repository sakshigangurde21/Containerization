using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.ModelBinding;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace DeviceManagementSolution.Domain.Entities
{
    public class Device
    {
        [BindNever]
        public int Id { get; set; }

        public string DeviceName { get; set; } = string.Empty;

        public string Description { get; set; } = string.Empty;

        public bool IsDeleted { get; set; } = false;

        [BindNever]
        public string UserId { get; set; } = string.Empty;

   // 👇 New relationship
    public int? ModbusConfigurationId { get; set; }   // nullable FK
    public ModbusConfiguration? ModbusConfiguration { get; set; }

    // Optional asset relation example
    public int? AssetId { get; set; }
    public bool IsConfigured { get; set; } = false;
    }
}
