using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace DeviceManagementSolution.Domain.Entities
{
    public class ModbusConfiguration
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public int DeviceId { get; set; }

        [ForeignKey("DeviceId")]
        public Device Device { get; set; } = null!;

        // Modbus-specific fields
        public int BaudRate { get; set; }
        public string Parity { get; set; } = "None";
        public int DataBits { get; set; } = 8;
        public int StopBits { get; set; } = 1;
        public string PortName { get; set; } = string.Empty;

        // Optional
        public string? RegisterAddress { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
