import React, { useState } from 'react';
import {
  Card,
  InputField,
  DataTable,
  ChartCard,
  SelectField,
  SelectOption,
} from '../components/ui';
import styles from './AdminDashboard.module.css';
import statStyles from '../components/ui/StatCard.module.css';
import Task from '../components/Task/task';
import StatsCards from '../components/ui/StatCard';
import Timeline from '../components/TimeLine/timeline';
import HomeCard from '../components/Card_home/home_card';
import Horizontal from '../components/Graphs/Horizontal/horizontal';
import Vertical from '../components/Graphs/Vertical/vertical';
import Notifications from '../components/notifications/notifications';
// Sample data for demonstration

const statusOptions: SelectOption[] = [
  { value: 'all', label: 'All Status' },
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
];

export default function AdminDashboard() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  return (
    <div className={styles.adminDashboard}>
      {/* Stats Cards */}
      <div className={statStyles.container}>
       <StatsCards/>
      </div>

      {/* Main Content Grid */}
      <div className={styles.contentGrid}>
        {/* Users Table */}
        <Card className={styles.tableCard}>
          <div className={styles.tableHeader}>
            <h2 className={styles.sectionTitle}>Users Management</h2>
            <div className={styles.filters}>
              <InputField
                placeholder="Search users..."
                value={searchTerm}
                onChange={setSearchTerm}
                className={styles.searchInput}
              />
              <SelectField
                value={statusFilter}
                options={statusOptions}
                onChange={(value) => setStatusFilter(String(value))}
                className={styles.filterSelect}
              />
              {/* <SelectField
                value={roleFilter}
                options={roleOptions}
                onChange={(value) => setRoleFilter(String(value))}
                className={styles.filterSelect}
              /> */}
            </div>
          </div>

          <DataTable
            autoFetchUsers
            kicker="User Management"
            heading="Current user overview"
            meta={['Live users', 'API Connected']}
          />
 
          <Timeline/>
          <div style={{display:"flex",justifyContent:"space-between",marginTop:"1.5rem",gap:"2rem"}}>
       <Horizontal/>
        <Vertical/>
          </div>
        </Card>

        {/* Charts Section */}
        <div className={styles.chartsGrid}>
          <ChartCard
            title="User Growth"
            subtitle="Monthly active users over time"
            actions={
              <SelectField
                value="30days"
                options={[
                  { value: '7days', label: '7 Days' },
                  { value: '30days', label: '30 Days' },
                  { value: '90days', label: '90 Days' },
                ]}
                onChange={() => {}}
              />
            }
            className={styles.growthCard}
          >
            <Task/>
              <HomeCard/>
          </ChartCard>
          {/* <ChartCard
            title="Revenue Breakdown"
            subtitle="Revenue by product category"
          >
          
          </ChartCard> */}
         
        </div>

        {/* Quick Actions */}
        {/* <Card className={styles.actionsCard}>
          <h2 className={styles.sectionTitle}>Quick Actions</h2>
          <div className={styles.actionsGrid}>
            <Button variant="primary" className={styles.actionButton}>
              📧 Send Newsletter
            </Button>
            <Button variant="secondary" className={styles.actionButton}>
              📊 Generate Report
            </Button>
            <Button variant="success" className={styles.actionButton}>
              ⚙️ System Settings
            </Button>
            <Button variant="danger" className={styles.actionButton}>
              🚨 Emergency Alert
            </Button>
          </div>
        </Card> */}
      </div>
    </div>
  );
}
