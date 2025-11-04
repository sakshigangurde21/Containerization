using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddModbusConfigurationAndDeviceIntegration : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "AssetId",
                table: "Devices",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsConfigured",
                table: "Devices",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<int>(
                name: "ModbusConfigurationId",
                table: "Devices",
                type: "int",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "ModbusConfiguration",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    DeviceId = table.Column<int>(type: "int", nullable: false),
                    BaudRate = table.Column<int>(type: "int", nullable: false),
                    Parity = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    DataBits = table.Column<int>(type: "int", nullable: false),
                    StopBits = table.Column<int>(type: "int", nullable: false),
                    PortName = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    RegisterAddress = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ModbusConfiguration", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ModbusConfiguration_Devices_DeviceId",
                        column: x => x.DeviceId,
                        principalTable: "Devices",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_ModbusConfiguration_DeviceId",
                table: "ModbusConfiguration",
                column: "DeviceId",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ModbusConfiguration");

            migrationBuilder.DropColumn(
                name: "AssetId",
                table: "Devices");

            migrationBuilder.DropColumn(
                name: "IsConfigured",
                table: "Devices");

            migrationBuilder.DropColumn(
                name: "ModbusConfigurationId",
                table: "Devices");
        }
    }
}
