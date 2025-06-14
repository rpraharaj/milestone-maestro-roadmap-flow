import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AppData, Capability, Milestone, RoadmapPlan } from '@/types';

interface DataContextType {
  data: AppData;
  addCapability: (capability: Omit<Capability, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateCapability: (id: string, capability: Partial<Capability>) => Promise<void>;
  deleteCapability: (id: string) => void;
  addMilestone: (milestone: Omit<Milestone, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateMilestone: (id: string, milestone: Partial<Milestone>) => void;
  deleteMilestone: (id: string) => void;
  addRoadmapPlan: (plan: Omit<RoadmapPlan, 'id' | 'createdAt' | 'version'>) => void;
  updateRoadmapPlan: (capabilityId: string, plan: Omit<RoadmapPlan, 'id' | 'capabilityId' | 'createdAt' | 'version'>) => void;
  deleteRoadmapPlan: (planId: string) => void;
  getRoadmapHistory: (capabilityId: string) => RoadmapPlan[];
  getActiveRoadmapPlan: (capabilityId: string) => RoadmapPlan | undefined;
  exportData: () => AppData;
  importData: (data: AppData) => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

const generateId = () => Math.random().toString(36).substr(2, 9);

export const DataProvider = ({ children }: { children: ReactNode }) => {
  const [data, setData] = useState<AppData>({
    capabilities: [],
    milestones: [],
    roadmapPlans: [],
  });

  // Load data from localStorage on mount
  useEffect(() => {
    try {
      const savedData = localStorage.getItem('projectManagerData');
      if (savedData) {
        console.log('🔄 DataContext: Loading saved data from localStorage');
        const parsedData = JSON.parse(savedData);
        // Convert date strings back to Date objects
        const processedData: AppData = {
          capabilities: parsedData.capabilities.map((cap: any) => ({
            ...cap,
            createdAt: new Date(cap.createdAt),
            updatedAt: new Date(cap.updatedAt),
          })),
          milestones: parsedData.milestones.map((mil: any) => ({
            ...mil,
            date: new Date(mil.date),
            createdAt: new Date(mil.createdAt),
            updatedAt: new Date(mil.updatedAt),
          })),
          roadmapPlans: parsedData.roadmapPlans.map((plan: any) => ({
            ...plan,
            requirementStartDate: new Date(plan.requirementStartDate),
            requirementEndDate: new Date(plan.requirementEndDate),
            designStartDate: new Date(plan.designStartDate),
            designEndDate: new Date(plan.designEndDate),
            devStartDate: new Date(plan.devStartDate),
            devEndDate: new Date(plan.devEndDate),
            cstStartDate: new Date(plan.cstStartDate),
            cstEndDate: new Date(plan.cstEndDate),
            uatStartDate: new Date(plan.uatStartDate),
            uatEndDate: new Date(plan.uatEndDate),
            createdAt: new Date(plan.createdAt),
          })),
        };
        setData(processedData);
        console.log('✅ DataContext: Data loaded successfully');
      }
    } catch (error) {
      console.error('❌ DataContext: Error loading saved data:', error);
    }
  }, []);

  // Save data to localStorage whenever data changes
  useEffect(() => {
    try {
      localStorage.setItem('projectManagerData', JSON.stringify(data));
      console.log('💾 DataContext: Data saved to localStorage');
    } catch (error) {
      console.error('❌ DataContext: Error saving data:', error);
    }
  }, [data]);

  const addCapability = async (capability: Omit<Capability, 'id' | 'createdAt' | 'updatedAt'>): Promise<void> => {
    console.log('🔄 DataContext: addCapability started with:', capability);
    
    return new Promise<void>((resolve, reject) => {
      try {
        // Simple validation
        if (!capability.name || capability.name.trim() === '') {
          console.error('❌ DataContext: Capability name is required');
          reject(new Error('Capability name is required'));
          return;
        }

        const now = new Date();
        const newCapability: Capability = {
          id: generateId(),
          name: capability.name.trim(),
          workstreamLead: capability.workstreamLead || '',
          sme: capability.sme || '',
          ba: capability.ba || '',
          milestone: capability.milestone || '',
          status: capability.status || 'Not Started',
          ragStatus: capability.ragStatus || 'Green',
          notes: capability.notes || '',
          createdAt: now,
          updatedAt: now,
        };

        console.log('✅ DataContext: New capability created:', newCapability);

        setData(prev => {
          const newData = {
            ...prev,
            capabilities: [...prev.capabilities, newCapability],
          };
          console.log('✅ DataContext: State updated successfully, total capabilities:', newData.capabilities.length);
          return newData;
        });

        // Resolve immediately
        console.log('✅ DataContext: addCapability completed successfully');
        resolve();

      } catch (error) {
        console.error('❌ DataContext: Error in addCapability:', error);
        reject(error);
      }
    });
  };

  const updateCapability = async (id: string, updates: Partial<Capability>): Promise<void> => {
    return new Promise<void>((resolve, reject) => {
      try {
        console.log('🔄 DataContext: updateCapability started for id:', id, 'updates:', updates);
        
        setData(prev => ({
          ...prev,
          capabilities: prev.capabilities.map(cap =>
            cap.id === id ? { ...cap, ...updates, updatedAt: new Date() } : cap
          ),
        }));
        
        console.log('✅ DataContext: updateCapability completed successfully');
        resolve();
      } catch (error) {
        console.error('❌ DataContext: Error in updateCapability:', error);
        reject(error);
      }
    });
  };

  const deleteCapability = (id: string) => {
    setData(prev => ({
      ...prev,
      capabilities: prev.capabilities.filter(cap => cap.id !== id),
      roadmapPlans: prev.roadmapPlans.filter(plan => plan.capabilityId !== id),
    }));
  };

  const addMilestone = (milestone: Omit<Milestone, 'id' | 'createdAt' | 'updatedAt'>) => {
    const now = new Date();
    const newMilestone: Milestone = {
      ...milestone,
      id: generateId(),
      createdAt: now,
      updatedAt: now,
    };
    setData(prev => ({
      ...prev,
      milestones: [...prev.milestones, newMilestone],
    }));
  };

  const updateMilestone = (id: string, updates: Partial<Milestone>) => {
    setData(prev => ({
      ...prev,
      milestones: prev.milestones.map(mil =>
        mil.id === id ? { ...mil, ...updates, updatedAt: new Date() } : mil
      ),
    }));
  };

  const deleteMilestone = (id: string) => {
    setData(prev => ({
      ...prev,
      milestones: prev.milestones.filter(mil => mil.id !== id),
    }));
  };

  const addRoadmapPlan = (plan: Omit<RoadmapPlan, 'id' | 'createdAt' | 'version'>) => {
    // Deactivate existing plans for this capability
    setData(prev => {
      const updatedPlans = prev.roadmapPlans.map(p =>
        p.capabilityId === plan.capabilityId ? { ...p, isActive: false } : p
      );
      
      const existingPlans = updatedPlans.filter(p => p.capabilityId === plan.capabilityId);
      const version = existingPlans.length + 1;
      
      const newPlan: RoadmapPlan = {
        ...plan,
        id: generateId(),
        version,
        createdAt: new Date(),
        isActive: true,
      };
      
      return {
        ...prev,
        roadmapPlans: [...updatedPlans, newPlan],
      };
    });
  };

  const updateRoadmapPlan = (capabilityId: string, updates: Omit<RoadmapPlan, 'id' | 'capabilityId' | 'createdAt' | 'version'>) => {
    // Create new version when updating
    addRoadmapPlan({ ...updates, capabilityId });
  };

  const deleteRoadmapPlan = (planId: string) => {
    setData(prev => {
      const deletedPlan = prev.roadmapPlans.find(plan => plan.id === planId);
      if (!deletedPlan) return prev;
      
      // Remove the plan
      const updatedPlans = prev.roadmapPlans.filter(plan => plan.id !== planId);
      
      // Get all remaining plans for the same capability
      const remainingPlansForCapability = updatedPlans
        .filter(plan => plan.capabilityId === deletedPlan.capabilityId)
        .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime()); // Sort by creation date
      
      // Resequence versions starting from 1
      remainingPlansForCapability.forEach((plan, index) => {
        plan.version = index + 1;
      });
      
      // If we deleted the active plan, make the most recent remaining plan active
      if (deletedPlan.isActive && remainingPlansForCapability.length > 0) {
        // Deactivate all plans first
        updatedPlans.forEach(plan => {
          if (plan.capabilityId === deletedPlan.capabilityId) {
            plan.isActive = false;
          }
        });
        
        // Make the highest version (most recent) plan active
        const mostRecentPlan = remainingPlansForCapability[remainingPlansForCapability.length - 1];
        mostRecentPlan.isActive = true;
      }
      
      return {
        ...prev,
        roadmapPlans: updatedPlans,
      };
    });
  };

  const getRoadmapHistory = (capabilityId: string): RoadmapPlan[] => {
    return data.roadmapPlans
      .filter(plan => plan.capabilityId === capabilityId)
      .sort((a, b) => b.version - a.version);
  };

  const getActiveRoadmapPlan = (capabilityId: string): RoadmapPlan | undefined => {
    return data.roadmapPlans.find(plan => plan.capabilityId === capabilityId && plan.isActive);
  };

  const exportData = () => data;

  const importData = (newData: AppData) => {
    setData(newData);
  };

  return (
    <DataContext.Provider
      value={{
        data,
        addCapability,
        updateCapability,
        deleteCapability,
        addMilestone,
        updateMilestone,
        deleteMilestone,
        addRoadmapPlan,
        updateRoadmapPlan,
        deleteRoadmapPlan,
        getRoadmapHistory,
        getActiveRoadmapPlan,
        exportData,
        importData,
      }}
    >
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};
