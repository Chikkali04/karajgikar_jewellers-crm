/* ==========================================================================
   KARAJGIKAR JEWELLERS CRM - APP ROOT (App.jsx)
   ========================================================================== */

import React, { useState } from 'react';
import { useCRM } from './context/CRMContext.jsx';
import Sidebar from './components/Layout/Sidebar.jsx';
import Header from './components/Layout/Header.jsx';
import MetalRatesTicker from './components/Layout/MetalRatesTicker.jsx';
import ToastContainer from './components/Layout/ToastContainer.jsx';
import ConfirmModal from './components/Layout/ConfirmModal.jsx';
import LoginModal from './components/Auth/LoginModal.jsx';

// Main Views
import DashboardView from './components/Dashboard/DashboardView.jsx';
import CustomerDirectory from './components/Customers/CustomerDirectory.jsx';
import CustomerModal from './components/Customers/CustomerModal.jsx';
import CustomerProfileDrawer from './components/Customers/CustomerProfileDrawer.jsx';
import PurchasesList from './components/Purchases/PurchasesList.jsx';
import AddPurchaseModal from './components/Purchases/AddPurchaseModal.jsx';
import InvoiceModal from './components/Purchases/InvoiceModal.jsx';
import FollowUpsView from './components/FollowUps/FollowUpsView.jsx';
import BirthdaysView from './components/Birthdays/BirthdaysView.jsx';
import FestivalsView from './components/Festivals/FestivalsView.jsx';
import InactiveCustomersView from './components/Inactive/InactiveCustomersView.jsx';
import MessageQueueView from './components/Messages/MessageQueueView.jsx';
import SettingsView from './components/Settings/SettingsView.jsx';

export default function App() {
  const {
    activeView,
    sidebarCollapsed,
    isUnlocked,
    quickAddCustomerOpen,
    setQuickAddCustomerOpen,
    quickAddPurchaseOpen,
    purchaseModalCustomerId,
    closeRecordPurchaseModal,
    activeCustomerProfileId,
    setActiveCustomerProfileId,
    activeInvoicePurchase,
    setActiveInvoicePurchase
  } = useCRM();

  const [customerToEdit, setCustomerToEdit] = useState(null);

  // If locked with PIN
  if (!isUnlocked) {
    return <LoginModal />;
  }

  const handleEditCustomer = (cust) => {
    setCustomerToEdit(cust);
    setQuickAddCustomerOpen(true);
  };

  const handleCloseCustomerModal = () => {
    setQuickAddCustomerOpen(false);
    setCustomerToEdit(null);
  };

  return (
    <div className="app-container">
      {/* Fixed Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className={`main-wrapper ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
        <Header />
        <MetalRatesTicker />

        <main className="main-content">
          {activeView === 'dashboard' && <DashboardView />}
          {activeView === 'customers' && <CustomerDirectory onEditCustomer={handleEditCustomer} />}
          {activeView === 'purchases' && <PurchasesList />}
          {activeView === 'followups' && <FollowUpsView />}
          {activeView === 'birthdays' && <BirthdaysView />}
          {activeView === 'festivals' && <FestivalsView />}
          {activeView === 'inactive' && <InactiveCustomersView />}
          {activeView === 'messages' && <MessageQueueView />}
          {activeView === 'settings' && <SettingsView />}
        </main>
      </div>

      {/* Global Modals and Drawers */}
      <CustomerModal
        isOpen={quickAddCustomerOpen}
        customerToEdit={customerToEdit}
        onClose={handleCloseCustomerModal}
      />

      <AddPurchaseModal
        isOpen={quickAddPurchaseOpen}
        defaultCustomerId={purchaseModalCustomerId}
        onClose={closeRecordPurchaseModal}
      />

      {activeCustomerProfileId && (
        <CustomerProfileDrawer
          customerId={activeCustomerProfileId}
          onClose={() => setActiveCustomerProfileId(null)}
        />
      )}

      {activeInvoicePurchase && (
        <InvoiceModal
          purchase={activeInvoicePurchase}
          onClose={() => setActiveInvoicePurchase(null)}
        />
      )}

      <ToastContainer />
      <ConfirmModal />
    </div>
  );
}
