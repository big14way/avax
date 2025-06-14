// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

import { AutomationCompatibleInterface } from "@chainlink/contracts/src/v0.8/automation/interfaces/AutomationCompatibleInterface.sol";
import { PropertyToken } from "./PropertyToken.sol";
import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { ReentrancyGuard } from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title PropertyAutomation
 * @notice Chainlink Automation for DREMS Platform Property Management
 * @dev Automates rent collection, distribution, maintenance scheduling, and portfolio rebalancing
 * 
 * Automated Functions:
 * 1. Monthly rent collection and distribution
 * 2. Quarterly property valuation updates
 * 3. Maintenance scheduling based on property age/condition
 * 4. Portfolio rebalancing when collateral ratios shift
 * 5. Insurance claim processing triggers
 */
contract PropertyAutomation is AutomationCompatibleInterface, Ownable, ReentrancyGuard {
    
    /*//////////////////////////////////////////////////////////////
                                 ERRORS
    //////////////////////////////////////////////////////////////*/
    error PropertyAutomation__InvalidPropertyContract();
    error PropertyAutomation__UpkeepNotNeeded();
    error PropertyAutomation__TaskExecutionFailed();
    error PropertyAutomation__InsufficientFunds();

    /*//////////////////////////////////////////////////////////////
                                 ENUMS
    //////////////////////////////////////////////////////////////*/
    enum AutomationTaskType {
        RENT_COLLECTION,
        RENT_DISTRIBUTION,
        PROPERTY_VALUATION,
        MAINTENANCE_CHECK,
        PORTFOLIO_REBALANCE,
        INSURANCE_CLAIM
    }

    /*//////////////////////////////////////////////////////////////
                                STRUCTS
    //////////////////////////////////////////////////////////////*/
    struct AutomationTask {
        address propertyAddress;
        AutomationTaskType taskType;
        uint256 scheduledTime;
        uint256 lastExecuted;
        bool isActive;
        bytes executionData;
    }

    struct PropertySchedule {
        uint256 nextRentCollection;
        uint256 nextValuationUpdate;
        uint256 nextMaintenanceCheck;
        uint256 rentCollectionInterval; // Monthly = 30 days
        uint256 valuationInterval; // Quarterly = 90 days
        uint256 maintenanceInterval; // Bi-annually = 180 days
    }

    /*//////////////////////////////////////////////////////////////
                           STATE VARIABLES
    //////////////////////////////////////////////////////////////*/
    PropertyToken public immutable i_propertyToken;
    
    // Automation Configuration
    uint256 public constant RENT_COLLECTION_INTERVAL = 30 days;
    uint256 public constant VALUATION_UPDATE_INTERVAL = 90 days;
    uint256 public constant MAINTENANCE_CHECK_INTERVAL = 180 days;
    uint256 public constant REBALANCE_THRESHOLD = 500; // 5% threshold for rebalancing
    uint256 public constant PERCENTAGE_PRECISION = 10000;
    
    // Task Management
    mapping(uint256 => AutomationTask) public automationTasks;
    mapping(address => PropertySchedule) public propertySchedules;
    mapping(address => bool) public registeredProperties;
    
    uint256 public nextTaskId;
    uint256 public totalActiveTasks;
    
    // Execution tracking
    mapping(AutomationTaskType => uint256) public lastGlobalExecution;
    mapping(address => mapping(AutomationTaskType => uint256)) public lastPropertyExecution;

    /*//////////////////////////////////////////////////////////////
                                 EVENTS
    //////////////////////////////////////////////////////////////*/
    event PropertyRegisteredForAutomation(
        address indexed property,
        uint256 rentCollectionInterval,
        uint256 valuationInterval,
        uint256 maintenanceInterval
    );
    
    event AutomationTaskScheduled(
        uint256 indexed taskId,
        address indexed property,
        AutomationTaskType taskType,
        uint256 scheduledTime
    );
    
    event AutomationTaskExecuted(
        uint256 indexed taskId,
        address indexed property,
        AutomationTaskType taskType,
        bool success,
        bytes returnData
    );
    
    event RentCollectionTriggered(
        address indexed property,
        uint256 timestamp
    );
    
    event PropertyValuationTriggered(
        address indexed property,
        uint256 timestamp
    );
    
    event MaintenanceCheckScheduled(
        address indexed property,
        uint256 scheduledDate
    );
    
    event PortfolioRebalanceNeeded(
        address indexed property,
        uint256 currentRatio,
        uint256 targetRatio
    );

    /*//////////////////////////////////////////////////////////////
                              CONSTRUCTOR
    //////////////////////////////////////////////////////////////*/
    constructor(address propertyTokenAddress) Ownable(msg.sender) {
        if (propertyTokenAddress == address(0)) {
            revert PropertyAutomation__InvalidPropertyContract();
        }
        i_propertyToken = PropertyToken(propertyTokenAddress);
    }

    /*//////////////////////////////////////////////////////////////
                        PROPERTY REGISTRATION
    //////////////////////////////////////////////////////////////*/
    /**
     * @notice Register a property for automated management
     * @param propertyAddress The property contract address
     * @param customRentInterval Custom rent collection interval (0 for default)
     * @param customValuationInterval Custom valuation update interval (0 for default)
     * @param customMaintenanceInterval Custom maintenance check interval (0 for default)
     */
    function registerPropertyForAutomation(
        address propertyAddress,
        uint256 customRentInterval,
        uint256 customValuationInterval,
        uint256 customMaintenanceInterval
    ) external onlyOwner {
        if (registeredProperties[propertyAddress]) {
            return; // Already registered
        }

        uint256 rentInterval = customRentInterval == 0 ? RENT_COLLECTION_INTERVAL : customRentInterval;
        uint256 valuationInterval = customValuationInterval == 0 ? VALUATION_UPDATE_INTERVAL : customValuationInterval;
        uint256 maintenanceInterval = customMaintenanceInterval == 0 ? MAINTENANCE_CHECK_INTERVAL : customMaintenanceInterval;

        propertySchedules[propertyAddress] = PropertySchedule({
            nextRentCollection: block.timestamp + rentInterval,
            nextValuationUpdate: block.timestamp + valuationInterval,
            nextMaintenanceCheck: block.timestamp + maintenanceInterval,
            rentCollectionInterval: rentInterval,
            valuationInterval: valuationInterval,
            maintenanceInterval: maintenanceInterval
        });

        registeredProperties[propertyAddress] = true;

        emit PropertyRegisteredForAutomation(
            propertyAddress,
            rentInterval,
            valuationInterval,
            maintenanceInterval
        );
    }

    /*//////////////////////////////////////////////////////////////
                       CHAINLINK AUTOMATION
    //////////////////////////////////////////////////////////////*/
    /**
     * @notice Chainlink Automation checkUpkeep function
     * @dev Check if any automation tasks need to be performed
     * @return upkeepNeeded Boolean indicating if upkeep is needed
     * @return performData Encoded data for tasks to perform
     */
    function checkUpkeep(bytes calldata /* checkData */) 
        external 
        view 
        override 
        returns (bool upkeepNeeded, bytes memory performData) 
    {
        AutomationTask[] memory pendingTasks = new AutomationTask[](10); // Max 10 tasks per upkeep
        uint256 taskCount = 0;

        // Check all registered properties for pending tasks
        uint256 propertyCount = i_propertyToken.getActivePropertiesCount();
        
        for (uint256 i = 0; i < propertyCount && taskCount < 10; i++) {
            address propertyAddr = i_propertyToken.getActiveProperty(i);
            
            if (!registeredProperties[propertyAddr]) {
                continue;
            }

            PropertySchedule memory schedule = propertySchedules[propertyAddr];
            
            // Check rent collection
            if (block.timestamp >= schedule.nextRentCollection) {
                pendingTasks[taskCount] = AutomationTask({
                    propertyAddress: propertyAddr,
                    taskType: AutomationTaskType.RENT_COLLECTION,
                    scheduledTime: schedule.nextRentCollection,
                    lastExecuted: lastPropertyExecution[propertyAddr][AutomationTaskType.RENT_COLLECTION],
                    isActive: true,
                    executionData: ""
                });
                taskCount++;
                if (taskCount >= 10) break;
            }
            
            // Check property valuation
            if (block.timestamp >= schedule.nextValuationUpdate) {
                pendingTasks[taskCount] = AutomationTask({
                    propertyAddress: propertyAddr,
                    taskType: AutomationTaskType.PROPERTY_VALUATION,
                    scheduledTime: schedule.nextValuationUpdate,
                    lastExecuted: lastPropertyExecution[propertyAddr][AutomationTaskType.PROPERTY_VALUATION],
                    isActive: true,
                    executionData: ""
                });
                taskCount++;
                if (taskCount >= 10) break;
            }
            
            // Check maintenance scheduling
            if (block.timestamp >= schedule.nextMaintenanceCheck) {
                pendingTasks[taskCount] = AutomationTask({
                    propertyAddress: propertyAddr,
                    taskType: AutomationTaskType.MAINTENANCE_CHECK,
                    scheduledTime: schedule.nextMaintenanceCheck,
                    lastExecuted: lastPropertyExecution[propertyAddr][AutomationTaskType.MAINTENANCE_CHECK],
                    isActive: true,
                    executionData: ""
                });
                taskCount++;
                if (taskCount >= 10) break;
            }
        }

        upkeepNeeded = taskCount > 0;
        if (upkeepNeeded) {
            // Resize array to actual task count
            AutomationTask[] memory actualTasks = new AutomationTask[](taskCount);
            for (uint256 i = 0; i < taskCount; i++) {
                actualTasks[i] = pendingTasks[i];
            }
            performData = abi.encode(actualTasks);
        }
    }

    /**
     * @notice Chainlink Automation performUpkeep function
     * @dev Execute pending automation tasks
     * @param performData Encoded data containing tasks to perform
     */
    function performUpkeep(bytes calldata performData) external override nonReentrant {
        AutomationTask[] memory tasks = abi.decode(performData, (AutomationTask[]));
        
        for (uint256 i = 0; i < tasks.length; i++) {
            AutomationTask memory task = tasks[i];
            
            bool success = _executeTask(task);
            
            if (success) {
                // Update execution timestamp
                lastPropertyExecution[task.propertyAddress][task.taskType] = block.timestamp;
                
                // Update next scheduled time
                _updateNextScheduledTime(task.propertyAddress, task.taskType);
            }
            
            emit AutomationTaskExecuted(
                nextTaskId,
                task.propertyAddress,
                task.taskType,
                success,
                ""
            );
            
            nextTaskId++;
        }
    }

    /*//////////////////////////////////////////////////////////////
                         TASK EXECUTION
    //////////////////////////////////////////////////////////////*/
    /**
     * @notice Execute a specific automation task
     * @param task The task to execute
     * @return success Whether the task executed successfully
     */
    function _executeTask(AutomationTask memory task) internal returns (bool success) {
        try this._safeExecuteTask(task) {
            success = true;
        } catch {
            success = false;
        }
    }

    /**
     * @notice Safely execute automation task with external call
     * @param task The task to execute
     */
    function _safeExecuteTask(AutomationTask memory task) external {
        require(msg.sender == address(this), "Only self");
        
        if (task.taskType == AutomationTaskType.RENT_COLLECTION) {
            _executeRentCollection(task.propertyAddress);
        } else if (task.taskType == AutomationTaskType.PROPERTY_VALUATION) {
            _executePropertyValuation(task.propertyAddress);
        } else if (task.taskType == AutomationTaskType.MAINTENANCE_CHECK) {
            _executeMaintenanceCheck(task.propertyAddress);
        }
    }

    /**
     * @notice Execute rent collection for a property
     * @param propertyAddress The property address
     */
    function _executeRentCollection(address propertyAddress) internal {
        i_propertyToken.requestRentCollection(propertyAddress);
        emit RentCollectionTriggered(propertyAddress, block.timestamp);
    }

    /**
     * @notice Execute property valuation update
     * @param propertyAddress The property address
     */
    function _executePropertyValuation(address propertyAddress) internal {
        i_propertyToken.requestPropertyValuation(propertyAddress);
        emit PropertyValuationTriggered(propertyAddress, block.timestamp);
    }

    /**
     * @notice Execute maintenance check
     * @param propertyAddress The property address
     */
    function _executeMaintenanceCheck(address propertyAddress) internal {
        // In a real implementation, this would trigger maintenance requests
        // For now, we'll emit an event and schedule next check
        emit MaintenanceCheckScheduled(propertyAddress, block.timestamp + MAINTENANCE_CHECK_INTERVAL);
    }

    /**
     * @notice Update next scheduled time for a task type
     * @param propertyAddress The property address
     * @param taskType The task type
     */
    function _updateNextScheduledTime(address propertyAddress, AutomationTaskType taskType) internal {
        PropertySchedule storage schedule = propertySchedules[propertyAddress];
        
        if (taskType == AutomationTaskType.RENT_COLLECTION) {
            schedule.nextRentCollection = block.timestamp + schedule.rentCollectionInterval;
        } else if (taskType == AutomationTaskType.PROPERTY_VALUATION) {
            schedule.nextValuationUpdate = block.timestamp + schedule.valuationInterval;
        } else if (taskType == AutomationTaskType.MAINTENANCE_CHECK) {
            schedule.nextMaintenanceCheck = block.timestamp + schedule.maintenanceInterval;
        }
    }

    /*//////////////////////////////////////////////////////////////
                          MANUAL TRIGGERS
    //////////////////////////////////////////////////////////////*/
    /**
     * @notice Manually trigger rent collection for a property
     * @param propertyAddress The property address
     */
    function manualRentCollection(address propertyAddress) external onlyOwner {
        if (!registeredProperties[propertyAddress]) {
            revert PropertyAutomation__InvalidPropertyContract();
        }
        
        _executeRentCollection(propertyAddress);
        lastPropertyExecution[propertyAddress][AutomationTaskType.RENT_COLLECTION] = block.timestamp;
        _updateNextScheduledTime(propertyAddress, AutomationTaskType.RENT_COLLECTION);
    }

    /**
     * @notice Manually trigger property valuation for a property
     * @param propertyAddress The property address
     */
    function manualPropertyValuation(address propertyAddress) external onlyOwner {
        if (!registeredProperties[propertyAddress]) {
            revert PropertyAutomation__InvalidPropertyContract();
        }
        
        _executePropertyValuation(propertyAddress);
        lastPropertyExecution[propertyAddress][AutomationTaskType.PROPERTY_VALUATION] = block.timestamp;
        _updateNextScheduledTime(propertyAddress, AutomationTaskType.PROPERTY_VALUATION);
    }

    /*//////////////////////////////////////////////////////////////
                           VIEW FUNCTIONS
    //////////////////////////////////////////////////////////////*/
    /**
     * @notice Get property schedule information
     * @param propertyAddress The property address
     * @return schedule The property's automation schedule
     */
    function getPropertySchedule(address propertyAddress) 
        external 
        view 
        returns (PropertySchedule memory schedule) 
    {
        return propertySchedules[propertyAddress];
    }

    /**
     * @notice Check if a property is registered for automation
     * @param propertyAddress The property address
     * @return isRegistered Whether the property is registered
     */
    function isPropertyRegistered(address propertyAddress) external view returns (bool isRegistered) {
        return registeredProperties[propertyAddress];
    }

    /**
     * @notice Get pending tasks count for all properties
     * @return pendingCount Number of pending automation tasks
     */
    function getPendingTasksCount() external view returns (uint256 pendingCount) {
        uint256 propertyCount = i_propertyToken.getActivePropertiesCount();
        
        for (uint256 i = 0; i < propertyCount; i++) {
            address propertyAddr = i_propertyToken.getActiveProperty(i);
            
            if (!registeredProperties[propertyAddr]) {
                continue;
            }

            PropertySchedule memory schedule = propertySchedules[propertyAddr];
            
            if (block.timestamp >= schedule.nextRentCollection) {
                pendingCount++;
            }
            if (block.timestamp >= schedule.nextValuationUpdate) {
                pendingCount++;
            }
            if (block.timestamp >= schedule.nextMaintenanceCheck) {
                pendingCount++;
            }
        }
    }

    /*//////////////////////////////////////////////////////////////
                          ADMIN FUNCTIONS
    //////////////////////////////////////////////////////////////*/
    /**
     * @notice Update automation intervals for a property
     * @param propertyAddress The property address
     * @param newRentInterval New rent collection interval
     * @param newValuationInterval New valuation update interval
     * @param newMaintenanceInterval New maintenance check interval
     */
    function updatePropertySchedule(
        address propertyAddress,
        uint256 newRentInterval,
        uint256 newValuationInterval,
        uint256 newMaintenanceInterval
    ) external onlyOwner {
        if (!registeredProperties[propertyAddress]) {
            revert PropertyAutomation__InvalidPropertyContract();
        }

        PropertySchedule storage schedule = propertySchedules[propertyAddress];
        schedule.rentCollectionInterval = newRentInterval;
        schedule.valuationInterval = newValuationInterval;
        schedule.maintenanceInterval = newMaintenanceInterval;
    }

    /**
     * @notice Emergency pause for a specific property's automation
     * @param propertyAddress The property address
     */
    function pausePropertyAutomation(address propertyAddress) external onlyOwner {
        registeredProperties[propertyAddress] = false;
    }

    /**
     * @notice Resume automation for a paused property
     * @param propertyAddress The property address
     */
    function resumePropertyAutomation(address propertyAddress) external onlyOwner {
        registeredProperties[propertyAddress] = true;
    }
} 