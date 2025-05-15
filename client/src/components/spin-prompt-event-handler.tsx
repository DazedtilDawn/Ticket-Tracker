import { useEffect } from 'react';

/**
 * Props for the spin prompt event handler hook
 */
interface SpinPromptEventHandlerProps {
  setDailyBonusId: (id: number | null) => void;
  setCompletedChoreName: (name: string) => void;
  setIsSpinPromptOpen: (isOpen: boolean) => void;
}

/**
 * Custom hook to handle the good behavior reward
 * wheel spin functionality in the dashboard
 */
export function useSpinPromptEventHandler({
  setDailyBonusId,
  setCompletedChoreName,
  setIsSpinPromptOpen
}: SpinPromptEventHandlerProps) {
  
  // Listen for the event that triggers opening the spin prompt modal
  useEffect(() => {
    console.log("Setting up spin prompt event handler");
    
    // Event handler for when the good behavior dialog triggers a spin prompt
    const handleOpenSpinPromptModal = (event: CustomEvent) => {
      console.log("Received custom event to open spin prompt modal:", event.detail);
      
      // Extract data from the event
      const { bonusId, childName, friendlyTrigger } = event.detail;
      
      if (bonusId && friendlyTrigger) {
        console.log(`Opening spin prompt for bonus ID ${bonusId} (${friendlyTrigger})`);
        
        // Set the state needed for the spin prompt modal
        setDailyBonusId(bonusId);
        setCompletedChoreName(friendlyTrigger);
        setIsSpinPromptOpen(true);
      } else {
        console.error("Missing required data in openSpinPromptModal event:", event.detail);
      }
    };
    
    // Add the event listener (with type assertion for CustomEvent)
    window.addEventListener('openSpinPromptModal', 
      handleOpenSpinPromptModal as EventListener);
    
    // Clean up the event listener on unmount
    return () => {
      window.removeEventListener('openSpinPromptModal', 
        handleOpenSpinPromptModal as EventListener);
    };
  }, [setDailyBonusId, setCompletedChoreName, setIsSpinPromptOpen]);
  
  // Hook doesn't return anything as it just sets up event handlers
  return;
}