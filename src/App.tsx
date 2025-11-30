import { useState } from 'react';
import { useAuth } from './contexts/AuthContext';
import TabBar from './components/TabBar';
import HomeScreen from './screens/HomeScreen';
import ChatScreen from './screens/ChatScreen'; // A importação correta já estava aqui
import WalletScreen from './screens/WalletScreen';
import AllGoalsScreen from './screens/AllGoalsScreen';
import AllMedalsScreen from './screens/AllMedalsScreen';
import NewGoalScreen from './screens/NewGoalScreen';
import SpendingHistoryScreen from './screens/SpendingHistoryScreen';
import DailySpendingHistoryScreen from './screens/DailySpendingHistoryScreen';
import { ProfileScreen } from './screens/ProfileScreen';
import BudgetScreen from './screens/BudgetScreen';
import LoginScreen from './screens/LoginScreen';
import SignUpScreen from './screens/SignUpScreen';
import type { Screen } from './types';
// REMOVIDO: import { OdeteChatScreen } from './screens/ChatScreen';

function App() {
  const { user, loading } = useAuth();
  const [showSignUp, setShowSignUp] = useState(false);
  const [activeTab, setActiveTab] = useState<Screen>('chat');
  const [walletTab, setWalletTab] = useState<'controle' | 'conquistas'>('controle');
  const [showAllGoals, setShowAllGoals] = useState(false);
  const [showAllMedals, setShowAllMedals] = useState(false);
  const [showSpendingHistory, setShowSpendingHistory] = useState(false);
  const [showInvestmentHistory, setShowInvestmentHistory] = useState(false);
  const [showDailySpendingHistory, setShowDailySpendingHistory] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showBudget, setShowBudget] = useState(false);
  const [showNewGoal, setShowNewGoal] = useState(false);

  const handleShowAllMedals = () => {
    setActiveTab('wallet');
    setWalletTab('conquistas');
    setShowAllMedals(true);
  };

  const handleShowAllGoals = () => {
    setActiveTab('wallet');
    setWalletTab('conquistas');
    setShowAllGoals(true);
  };

  const handleCreateNewGoal = () => {
    setShowNewGoal(true);
    setShowAllGoals(false)
  };

  const handleAskOdete = () => {
    setShowNewGoal(false);
    setActiveTab('chat');
  };

  const handleShowSpendingHistory = () => {
    setActiveTab('wallet');
    setWalletTab('controle');
    setShowSpendingHistory(true);
  };

  const handleShowInvestmentHistory = () => {
    setActiveTab('wallet');
    setWalletTab('controle');
    setShowInvestmentHistory(true);
  };

  const handleShowDailySpendingHistory = () => {
    setActiveTab('wallet');
    setWalletTab('controle');
    setShowDailySpendingHistory(true);
  };

  const handleLogout = () => {
    setShowProfile(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-lg animate-pulse">
            <span className="text-3xl font-bold text-white">O</span>
          </div>
          <p className="text-stone-600 font-medium">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    if (showSignUp) {
      return <SignUpScreen onLoginClick={() => setShowSignUp(false)} />;
    }
    return <LoginScreen onSignUpClick={() => setShowSignUp(true)} />;
  }

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 flex flex-col max-w-md mx-auto relative">
      {!showAllGoals && !showAllMedals && !showSpendingHistory && !showInvestmentHistory && !showDailySpendingHistory && !showProfile && !showBudget && !showNewGoal && (
        <>
          {activeTab === 'home' && (
            <HomeScreen
              onShowProfile={() => setShowProfile(true)}
              onShowBudget={() => setShowBudget(true)}
            />
          )}
          {/* CORRIGIDO: Usando o componente ChatScreen importado corretamente */}
          {activeTab === 'chat' && <ChatScreen onShowProfile={() => setShowProfile(true)} />}
              {activeTab === 'wallet' && (
            <WalletScreen
              activeTab={walletTab}
              onTabChange={setWalletTab}
              onShowAllGoals={handleShowAllGoals}
              onShowAllMedals={handleShowAllMedals}
              onShowSpendingHistory={handleShowSpendingHistory}
              onShowInvestmentHistory={handleShowInvestmentHistory}
              onShowDailySpendingHistory={handleShowDailySpendingHistory}
              onShowProfile={() => setShowProfile(true)}
              onCreateGoal={handleCreateNewGoal}
            />
          )}
          <TabBar activeTab={activeTab} onTabChange={setActiveTab} />
        </>
      )}

      {showAllGoals && <AllGoalsScreen onBack={() => setShowAllGoals(false)} onCreateGoal={handleCreateNewGoal} />}
      {showAllMedals && <AllMedalsScreen onBack={() => setShowAllMedals(false)} />}
      {showSpendingHistory && <SpendingHistoryScreen onBack={() => setShowSpendingHistory(false)} />}
      {showInvestmentHistory && <SpendingHistoryScreen onBack={() => setShowInvestmentHistory(false)} />}
      {showDailySpendingHistory && <DailySpendingHistoryScreen onBack={() => setShowDailySpendingHistory(false)} />}
      {showProfile && (
        <ProfileScreen
          onBack={() => setShowProfile(false)}
          onLogout={handleLogout}
        />
      )}
      {showBudget && <BudgetScreen onBack={() => setShowBudget(false)} />}
      {showNewGoal && <NewGoalScreen onBack={() => setShowNewGoal(false)} onAskOdete={handleAskOdete} />}
    </div>
  );
}

export default App;
