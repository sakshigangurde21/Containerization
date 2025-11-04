using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class SyncDeviceModelChanges : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_ModbusConfiguration_Devices_DeviceId",
                table: "ModbusConfiguration");

            migrationBuilder.DropPrimaryKey(
                name: "PK_ModbusConfiguration",
                table: "ModbusConfiguration");

            migrationBuilder.RenameTable(
                name: "ModbusConfiguration",
                newName: "ModbusConfigurations");

            migrationBuilder.RenameIndex(
                name: "IX_ModbusConfiguration_DeviceId",
                table: "ModbusConfigurations",
                newName: "IX_ModbusConfigurations_DeviceId");

            migrationBuilder.AddPrimaryKey(
                name: "PK_ModbusConfigurations",
                table: "ModbusConfigurations",
                column: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_ModbusConfigurations_Devices_DeviceId",
                table: "ModbusConfigurations",
                column: "DeviceId",
                principalTable: "Devices",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_ModbusConfigurations_Devices_DeviceId",
                table: "ModbusConfigurations");

            migrationBuilder.DropPrimaryKey(
                name: "PK_ModbusConfigurations",
                table: "ModbusConfigurations");

            migrationBuilder.RenameTable(
                name: "ModbusConfigurations",
                newName: "ModbusConfiguration");

            migrationBuilder.RenameIndex(
                name: "IX_ModbusConfigurations_DeviceId",
                table: "ModbusConfiguration",
                newName: "IX_ModbusConfiguration_DeviceId");

            migrationBuilder.AddPrimaryKey(
                name: "PK_ModbusConfiguration",
                table: "ModbusConfiguration",
                column: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_ModbusConfiguration_Devices_DeviceId",
                table: "ModbusConfiguration",
                column: "DeviceId",
                principalTable: "Devices",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
