import FungibleToken from "./utility/FungibleToken.cdc"
import FUSD from "./utility/FUSD.cdc"
import FlowToken from "./utility/FlowToken.cdc" 

pub contract Toucans {

  pub let CollectionStoragePath: StoragePath
  pub let CollectionPublicPath: PublicPath

  pub resource interface Minter {
    pub fun mint(amount: UFix64): @FungibleToken.Vault {
      post {
        result.balance == amount: "Did not mint correct number of tokens."
      }
    }
  }

  pub enum Stage: UInt8 {
    pub case NOT_STARTED
    pub case ACTIVE
    pub case SUCCESS
    pub case FAIL
  }

  pub event NewFundingCycle(
    projectId: UInt64, 
    projectOwner: Address, 
    currentCycle: UInt64,
    fundingTarget: UFix64?,
    issuanceRate: UFix64,
    reserveRate: UFix64,
    numOfTokensPurchased: UFix64,
    timeFrame: CycleTimeFrame?,
    funders: {Address: UFix64},
    numOfFlowContributed: UFix64,
    purchaseHistory: [PurchaseData]
  )

  pub struct PurchaseData {
    pub let amount: UFix64
    pub let buyer: Address
    pub let timestamp: UFix64
    pub let volumesAfter: UFix64

    init(_ amount: UFix64, _ buyer: Address, _ volumeAfter: UFix64) {
      self.amount = amount
      self.buyer = buyer
      self.timestamp = getCurrentBlock().timestamp
      self.volumesAfter = volumeAfter
    }
  }

  pub struct CycleTimeFrame {
    pub let startTime: UFix64
    pub let endTime: UFix64?

    init(_ startTime: UFix64, _ endTime: UFix64?) {
      pre {
        endTime == nil || (endTime! > startTime): "The end time must be greater than the start time."
        startTime >= getCurrentBlock().timestamp: "Start time must be now or in the future."
      }
      self.startTime = startTime
      self.endTime = endTime
    }
  }

  pub struct Payout {
    pub let address: Address
    pub let percent: UFix64

    init(address: Address, percent: UFix64) {
      pre {
        percent > 0.0 && percent < 1.0: "percent must be a percantage."
      }
      self.address = address
      self.percent = percent
    }
  }

  pub struct FundingCycle {
    pub let cycleNum: UInt64
    // nil if the funding target is infinity
    pub let fundingTarget: UFix64?
    pub let issuanceRate: UFix64
    // a tax on purchases
    pub let reserveRate: UFix64
    pub var numOfTokensPurchased: UFix64
    pub let timeFrame: CycleTimeFrame
    pub let funders: {Address: UFix64}
    pub var numOfFlowContributed: UFix64
    pub let purchaseHistory: [PurchaseData]
    pub var stage: Stage
    pub let payouts: [Payout]
    pub var extra: {String: AnyStruct}

    pub fun trackPurchase(amount: UFix64, amountOfFlow: UFix64, payer: Address) {
      self.numOfTokensPurchased = self.numOfTokensPurchased + amount
      self.funders[payer] = (self.funders[payer] ?? 0.0) + amountOfFlow
      self.numOfFlowContributed = self.numOfFlowContributed + amountOfFlow
      self.purchaseHistory.append(PurchaseData(amount, payer, self.numOfFlowContributed))
    }

    access(contract) fun setStage(_ stage: Stage) {
      self.stage = stage
    }

    init(_cycleNum: UInt64, _fundingTarget: UFix64?, _issuanceRate: UFix64, _reserveRate: UFix64, _timeFrame: CycleTimeFrame, _payouts: [Payout], _ extra: {String: String}) {
      pre {
        _reserveRate <= 1.0: "You must provide a reserve rate value between 0.0 and 1.0"
      }
      self.cycleNum = _cycleNum
      self.issuanceRate = _issuanceRate
      self.fundingTarget = _fundingTarget
      self.reserveRate = _reserveRate
      self.numOfTokensPurchased = 0.0
      self.timeFrame = _timeFrame
      self.funders = {}
      self.numOfFlowContributed = 0.0
      self.purchaseHistory = []
      if _timeFrame == nil {
        self.stage = Stage.ACTIVE
      }
      self.stage = Stage.NOT_STARTED
      self.extra = extra
      self.payouts = _payouts.concat([Payout(address: Toucans.account.address, percent: 0.025)])

      var percentCount: UFix64 = 0.0
      for payout in self.payouts {
        percentCount = percentCount + payout.percent
      }
      assert(percentCount <= 1.0, message: "Percents cannot be more than 100%.")
    }
  }

  pub resource interface ProjectPublic {
    pub let projectId: UInt64
    pub let tokenType: Type
    pub var currentFundingCycle: UInt64
    pub var totalBought: UFix64
    pub var extra: {String: AnyStruct}

    // Setters
    pub fun depositToTreasury(vault: @FungibleToken.Vault)
    pub fun purchase(paymentTokens: @FlowToken.Vault, payerTokenVault: &{FungibleToken.Receiver})
    
    // Getters
    pub fun getCurrentIssuanceRate(): UFix64
    pub fun getCurrentFundingCycle(): FundingCycle
    pub fun getFundingCycles(): [FundingCycle]
    pub fun getVaultTypesInTreasury(): [Type]
    pub fun getVaultBalanceInTreasury(vaultType: Type): UFix64?
  }

  pub resource Project: ProjectPublic {
    pub let projectId: UInt64
    pub let tokenType: Type
    pub var currentFundingCycle: UInt64
    pub var totalBought: UFix64
    pub var extra: {String: AnyStruct}

    access(self) var fundingCycles: [FundingCycle]
    access(self) let treasury: @{Type: FungibleToken.Vault}
    access(self) let minter: @{Minter}

    // NOTES:
    // If fundingTarget is nil, that means this is an on-going funding round,
    // and there is no limit. 
    // If this is the case, the project owner must continue to pass in 
    // projectTokens so users can receive them immediately when purchasing.
    pub fun configureFundingCycle(fundingTarget: UFix64?, issuanceRate: UFix64, reserveRate: UFix64, timeFrame: CycleTimeFrame, payouts: [Payout], extra: {String: String}) {
      self.currentFundingCycle = UInt64(self.fundingCycles.length)
      let newFundingCycle: FundingCycle = FundingCycle(
        _cycleNum: self.currentFundingCycle,
        _fundingTarget: fundingTarget,
        _issuanceRate: issuanceRate,
        _reserveRate: reserveRate,
        _timeFrame: timeFrame,
        _payouts: payouts,
        extra
      )

      self.fundingCycles.append(newFundingCycle)

      emit NewFundingCycle(
        projectId: self.projectId, 
        projectOwner: self.owner!.address, 
        currentCycle: self.currentFundingCycle,
        fundingTarget: newFundingCycle.fundingTarget,
        issuanceRate: newFundingCycle.issuanceRate,
        reserveRate: newFundingCycle.reserveRate,
        numOfTokensPurchased: newFundingCycle.numOfTokensPurchased,
        timeFrame: newFundingCycle.timeFrame,
        funders: newFundingCycle.funders,
        numOfFlowContributed: newFundingCycle.numOfFlowContributed,
        purchaseHistory: newFundingCycle.purchaseHistory
      )
    }

    // mintedTokens comes from the wrapper `Owner` resource
    // present in every Toucans token contract.
    // Sheesh, you are so smart Jacob.
    pub fun purchase(paymentTokens: @FlowToken.Vault, payerTokenVault: &{FungibleToken.Receiver}) {
      let fundingCycleRef: &FundingCycle = self.getCurrentFundingCycleRef()
      let currentTime: UFix64 = getCurrentBlock().timestamp
      let amountOfFlowSent: UFix64 = paymentTokens.balance
      // Assert that if there is a time frame on the cycle, we are within it
      assert(
        (fundingCycleRef.timeFrame.startTime <= currentTime && (fundingCycleRef.timeFrame.endTime == nil || fundingCycleRef.timeFrame.endTime! >= currentTime)),
        message: "The current funding cycle has either not begun or has ended. The project owner must start a new one to further continue funding."
      )

      let issuanceRate: UFix64 = self.getCurrentIssuanceRate()
      let amount: UFix64 = issuanceRate * amountOfFlowSent
      let mintedTokens <- self.minter.mint(amount: amount)
      assert(mintedTokens.getType() == self.tokenType, message: "Someone is messing with the minter. It's not minting the original type.")
      assert(amount == mintedTokens.balance, message: "Not enough tokens were minted.")
      
      fundingCycleRef.trackPurchase(amount: amount, amountOfFlow: amountOfFlowSent, payer: payerTokenVault.owner!.address)
      // Tokens were purchased, so increment amount raised
      self.totalBought = self.totalBought + amount

      // Tax the purchased tokens with reserve rate
      let tax: @FungibleToken.Vault <- mintedTokens.withdraw(amount: mintedTokens.balance * fundingCycleRef.reserveRate)
      // Deposit new tokens to payer
      payerTokenVault.deposit(from: <- mintedTokens)
      // Deposit tax to project treasury
      self.depositToTreasury(vault: <- tax)

      // Calculate payouts
      for payout in fundingCycleRef.payouts {
        Toucans.depositTokensToAccount(funds: <- paymentTokens.withdraw(amount: amountOfFlowSent * payout.percent), to: payout.address, publicPath: /public/flowTokenReceiver)
      }
      // Deposit the rest to treasury
      self.depositToTreasury(vault: <- paymentTokens)
    }

    // Helper Functions

    pub fun depositToTreasury(vault: @FungibleToken.Vault) {
      if let existingVault = &self.treasury[vault.getType()] as &FungibleToken.Vault? {
        existingVault.deposit(from: <- vault)
      } else {
        self.treasury[vault.getType()] <-! vault
      }
    }

    // Getters

    pub fun getVaultTypesInTreasury(): [Type] {
      return self.treasury.keys
    }

    pub fun getVaultBalanceInTreasury(vaultType: Type): UFix64? {
      return self.treasury[vaultType]?.balance
    }

    pub fun getCurrentIssuanceRate(): UFix64 {
      return self.getCurrentFundingCycle().issuanceRate
    }

    pub fun getCurrentFundingCycle(): FundingCycle {
      return self.fundingCycles[self.currentFundingCycle]
    }

    access(self) fun getCurrentFundingCycleRef(): &FundingCycle {
      return &self.fundingCycles[self.currentFundingCycle] as &FundingCycle
    }

    pub fun getFundingCycles(): [FundingCycle] {
      return self.fundingCycles
    }

    init(minter: @{Minter}) {
      self.projectId = self.uuid
      self.currentFundingCycle = 0
      self.fundingCycles = []
      self.totalBought = 0.0
      self.extra = {}
      let testMint: @FungibleToken.Vault <- minter.mint(amount: 0.0)
      self.tokenType = testMint.getType()
      self.treasury <- {testMint.getType(): <- testMint}
      self.minter <- minter
    }

    destroy() {
      destroy self.treasury
      destroy self.minter
    }
  }

  pub resource interface CollectionPublic {
    pub fun getProjectTypes(): [Type]
    pub fun borrowProjectPublic(projectType: Type): &Project{ProjectPublic}?
  }

  pub resource Collection: CollectionPublic {
    pub let projects: @{Type: Project}

    pub fun createProject(minter: @{Minter}) {
      let project <- create Project(minter: <- minter)
      self.projects[project.tokenType] <-! project
    }

    pub fun borrowProject(projectType: Type): &Project? {
      return &self.projects[projectType] as &Project?
    }

    pub fun getProjectTypes(): [Type] {
      return self.projects.keys
    }

    pub fun borrowProjectPublic(projectType: Type): &Project{ProjectPublic}? {
      return &self.projects[projectType] as &Project{ProjectPublic}?
    }

    init() {
      self.projects <- {}
    }

    destroy() {
      destroy self.projects
    }
  }

  pub fun createCollection(): @Collection {
    return <- create Collection()
  }

  pub fun depositTokensToAccount(funds: @FungibleToken.Vault, to: Address, publicPath: PublicPath) {
    let vault = getAccount(to).getCapability(publicPath).borrow<&{FungibleToken.Receiver}>() 
              ?? panic("Account does not have a proper Vault set up.")
    vault.deposit(from: <- funds)
  }

  init() {
    self.CollectionStoragePath = /storage/ToucansCollection
    self.CollectionPublicPath = /public/ToucansCollection
  }

}
 