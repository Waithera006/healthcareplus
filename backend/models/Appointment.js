const fileDB = require('../utils/fileDB');

class Appointment {
  static async create(appointmentData) {
    try {
      const appointment = {
        ...appointmentData,
        status: appointmentData.status || 'pending',
        priority: appointmentData.priority || 'medium',
        appointmentType: appointmentData.appointmentType || 'consultation',
        createdAt: appointmentData.createdAt || new Date().toISOString(),
        updatedAt: appointmentData.updatedAt || new Date().toISOString()
      };
      
      return await fileDB.create('appointments', appointment);
    } catch (error) {
      console.error('Error creating appointment:', error);
      throw error;
    }
  }

  static async findById(id) {
    try {
      return await fileDB.getById('appointments', id);
    } catch (error) {
      console.error('Error finding appointment by id:', error);
      return null;
    }
  }

  static async findByUserId(userId) {
    try {
      const appointments = await fileDB.getAll('appointments');
      return appointments.filter(appt => appt.userId === userId);
    } catch (error) {
      console.error('Error finding appointments by user id:', error);
      return [];
    }
  }

  static async findByEmail(email) {
    try {
      const appointments = await fileDB.getAll('appointments');
      return appointments.filter(appt => 
        appt.patientEmail && appt.patientEmail.toLowerCase() === email.toLowerCase()
      );
    } catch (error) {
      console.error('Error finding appointments by email:', error);
      return [];
    }
  }

  static async findByStatus(status) {
    try {
      const appointments = await fileDB.getAll('appointments');
      return appointments.filter(appt => 
        appt.status && appt.status.toLowerCase() === status.toLowerCase()
      );
    } catch (error) {
      console.error('Error finding appointments by status:', error);
      return [];
    }
  }

  static async findByDepartment(department) {
    try {
      const appointments = await fileDB.getAll('appointments');
      return appointments.filter(appt => 
        appt.department && appt.department.toLowerCase() === department.toLowerCase()
      );
    } catch (error) {
      console.error('Error finding appointments by department:', error);
      return [];
    }
  }

  static async findByDateRange(startDate, endDate) {
    try {
      const appointments = await fileDB.getAll('appointments');
      const start = new Date(startDate);
      const end = new Date(endDate);
      
      return appointments.filter(appt => {
        const createdAt = new Date(appt.createdAt);
        return createdAt >= start && createdAt <= end;
      });
    } catch (error) {
      console.error('Error finding appointments by date range:', error);
      return [];
    }
  }

  static async update(id, updateData) {
    try {
      const dataToUpdate = {
        ...updateData,
        updatedAt: new Date().toISOString()
      };
      return await fileDB.update('appointments', id, dataToUpdate);
    } catch (error) {
      console.error('Error updating appointment:', error);
      return null;
    }
  }

  static async delete(id) {
    try {
      return await fileDB.remove('appointments', id);
    } catch (error) {
      console.error('Error deleting appointment:', error);
      return false;
    }
  }

  static async getAll() {
    try {
      return await fileDB.getAll('appointments');
    } catch (error) {
      console.error('Error getting all appointments:', error);
      return [];
    }
  }

  static async getByDate(date) {
    try {
      const appointments = await fileDB.getAll('appointments');
      const targetDate = new Date(date).toDateString();
      
      return appointments.filter(appt => {
        const apptDate = new Date(appt.createdAt).toDateString();
        return apptDate === targetDate;
      });
    } catch (error) {
      console.error('Error getting appointments by date:', error);
      return [];
    }
  }

  static async getTodaysAppointments() {
    try {
      const appointments = await fileDB.getAll('appointments');
      const today = new Date().toDateString();
      
      return appointments.filter(appt => {
        const apptDate = new Date(appt.createdAt).toDateString();
        return apptDate === today;
      });
    } catch (error) {
      console.error('Error getting today\'s appointments:', error);
      return [];
    }
  }

  static async getStats() {
    try {
      const appointments = await this.getAll();
      
      const stats = {
        total: {
          appointments: appointments.length,
          patients: new Set(appointments.map(appt => appt.patientEmail)).size
        },
        today: {
          appointments: appointments.filter(appt => {
            const today = new Date().toDateString();
            const apptDate = new Date(appt.createdAt).toDateString();
            return apptDate === today;
          }).length
        },
        byStatus: {},
        byDepartment: {},
        byMonth: {},
        recent: []
      };
      
      // Count by status
      appointments.forEach(appt => {
        const status = appt.status || 'pending';
        stats.byStatus[status] = (stats.byStatus[status] || 0) + 1;
      });
      
      // Count by department
      appointments.forEach(appt => {
        const dept = appt.department || 'general';
        stats.byDepartment[dept] = (stats.byDepartment[dept] || 0) + 1;
      });
      
      // Count by month (last 6 months)
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
      
      appointments
        .filter(appt => new Date(appt.createdAt) >= sixMonthsAgo)
        .forEach(appt => {
          const month = new Date(appt.createdAt).toLocaleString('default', { 
            month: 'short', 
            year: 'numeric' 
          });
          stats.byMonth[month] = (stats.byMonth[month] || 0) + 1;
        });
      
      // Get recent appointments (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      stats.recent = appointments
        .filter(appt => new Date(appt.createdAt) >= thirtyDaysAgo)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 10); // Get last 10 appointments
      
      return stats;
    } catch (error) {
      console.error('Error getting appointment stats:', error);
      return {
        total: { appointments: 0, patients: 0 },
        today: { appointments: 0 },
        byStatus: {},
        byDepartment: {},
        byMonth: {},
        recent: []
      };
    }
  }

  static async search(query) {
    try {
      const appointments = await fileDB.getAll('appointments');
      const searchTerm = query.toLowerCase();
      
      return appointments.filter(appt => {
        return (
          (appt.patientName && appt.patientName.toLowerCase().includes(searchTerm)) ||
          (appt.patientEmail && appt.patientEmail.toLowerCase().includes(searchTerm)) ||
          (appt.patientPhone && appt.patientPhone.includes(searchTerm)) ||
          (appt.department && appt.department.toLowerCase().includes(searchTerm)) ||
          (appt.id && appt.id.toLowerCase().includes(searchTerm))
        );
      });
    } catch (error) {
      console.error('Error searching appointments:', error);
      return [];
    }
  }

  static async count() {
    try {
      const appointments = await fileDB.getAll('appointments');
      return appointments.length;
    } catch (error) {
      console.error('Error counting appointments:', error);
      return 0;
    }
  }

  static async countByStatus(status) {
    try {
      const appointments = await fileDB.getAll('appointments');
      return appointments.filter(appt => 
        appt.status && appt.status.toLowerCase() === status.toLowerCase()
      ).length;
    } catch (error) {
      console.error('Error counting appointments by status:', error);
      return 0;
    }
  }

  static async countByDepartment(department) {
    try {
      const appointments = await fileDB.getAll('appointments');
      return appointments.filter(appt => 
        appt.department && appt.department.toLowerCase() === department.toLowerCase()
      ).length;
    } catch (error) {
      console.error('Error counting appointments by department:', error);
      return 0;
    }
  }

  static async bulkUpdate(ids, updateData) {
    try {
      const appointments = await fileDB.getAll('appointments');
      let updatedCount = 0;
      
      for (const id of ids) {
        const index = appointments.findIndex(appt => appt.id === id);
        if (index !== -1) {
          appointments[index] = {
            ...appointments[index],
            ...updateData,
            updatedAt: new Date().toISOString()
          };
          updatedCount++;
        }
      }
      
      await fileDB.writeFile('appointments.json', appointments);
      return updatedCount;
    } catch (error) {
      console.error('Error bulk updating appointments:', error);
      return 0;
    }
  }

  static async deleteOldAppointments(daysOld = 90) {
    try {
      const appointments = await fileDB.getAll('appointments');
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);
      
      const filteredAppointments = appointments.filter(appt => {
        const createdAt = new Date(appt.createdAt);
        return createdAt >= cutoffDate;
      });
      
      await fileDB.writeFile('appointments.json', filteredAppointments);
      return appointments.length - filteredAppointments.length;
    } catch (error) {
      console.error('Error deleting old appointments:', error);
      return 0;
    }
  }
}

module.exports = Appointment;