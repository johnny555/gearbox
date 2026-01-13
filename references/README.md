# E-CVT / Power-Split Transmission Simulation References

## Downloaded PDFs (in this folder)

### PhD Thesis
1. **Corbelli_PhD_Thesis_eCVT_Power_Split_Drivelines.pdf** (37 MB)
   - Author: Piero Corbelli
   - Institution: University of Bologna
   - Comprehensive coverage of bond graph modeling, one-mode and two-mode power-split systems
   - Highly recommended as primary reference

### Journal Papers
2. **Liu_Peng_Modeling_Control_PowerSplit_HEV_IEEE2008.pdf** (1.5 MB)
   - Title: "Modeling and Control of a Power-Split Hybrid Vehicle"
   - Authors: Liu, J. & Peng, H.
   - Source: IEEE Transactions on Control Systems Technology, Vol. 16, No. 6, 2008
   - Key content: State-space formulation, Dynamic Programming, ECMS control

3. **Modeling_Analysis_Toyota_Hybrid_System_UVic.pdf** (408 KB)
   - Title: "Modeling and Analysis of the Toyota Hybrid System"
   - Source: University of Victoria / IEEE
   - Key content: THS-specific modeling, Simulink implementation

4. **Scientific_Reports_TwoMode_PowerSplit_2025.pdf** (9.4 MB)
   - Title: "Powertrain configuration design for two mode power split hybrid electric vehicle"
   - Source: Nature Scientific Reports, 2025
   - Key content: Two-mode power-split design methodology

### Conference Papers
5. **Zhang_Design_PowerSplit_Single_Planetary_Gear_DSCC2012.pdf** (737 KB)
   - Title: "Design of Power-Split Hybrid Vehicles with a Single Planetary Gear"
   - Authors: Zhang, X., Peng, H., Sun, J.
   - Source: ASME Dynamic Systems and Control Conference, 2012
   - Key content: Design space exploration, lever analogy

6. **Optimal_Design_Three_Planetary_Gear_PowerSplit_arXiv.pdf** (1.2 MB)
   - Title: "Optimal Design of Three-Planetary-Gear Power-Split Hybrid Powertrains"
   - Source: arXiv:1708.00151
   - Key content: Multi-planetary gear optimization

---

## Textbooks (Not Freely Available - Recommend Library/Purchase)

### Primary Textbook
- **"Modern Electric, Hybrid Electric, and Fuel Cell Vehicles: Fundamentals, Theory, and Design"**
  - Authors: Mehrdad Ehsani, Yimin Gao, Stefano Longo, Kambiz Ebrahimi
  - Publisher: CRC Press, 3rd Edition (2018)
  - ISBN: 978-1498761772
  - Chapters on power-split transmissions, planetary gears, control strategies
  - https://www.routledge.com/Modern-Electric-Hybrid-Electric-and-Fuel-Cell-Vehicles/Ehsani-Gao-Longo-Ebrahimi/p/book/9781498761772

### Secondary Textbook
- **"Electric Vehicle Technology Explained"**
  - Authors: James Larminie, John Lowry
  - Publisher: Wiley, 2nd Edition (2012)
  - ISBN: 978-1119942733
  - Coverage of series/parallel hybrid configurations, transmission systems
  - https://onlinelibrary.wiley.com/doi/book/10.1002/9781118361146

---

## Additional Papers (Behind Paywall - Access via University Library)

### SAE Technical Papers
- **SAE 2008-01-1313**: "Control-Oriented Modeling of Power Split Devices in Combined Hybrid-Electric Vehicles"
  - Authors: Sciarretta, Dabadie, Albrecht
  - https://saemobilus.sae.org/content/2008-01-1313/

- **SAE 810102**: "The Lever Analogy: A New Tool in Transmission Analysis" (1981)
  - Authors: Benford & Leising
  - Classic foundational paper for lever diagram method

### IEEE Papers
- **IEEE Trans. Vehicular Tech. (2016)**: "Design of Multimode Power-Split Hybrid Vehicles—A Case Study on the Voltec Powertrain System"
  - Authors: Zhang, Li, Peng, Sun
  - Vol. 65, No. 6, pp. 4790-4801

### Springer Papers
- **Int. J. Automotive Technology (2012)**: "Dynamic modeling of the electro-mechanical configuration of the Toyota Hybrid System series/parallel power train"
  - Authors: Mansour & Clodic
  - https://link.springer.com/article/10.1007/s12239-012-0013-8

- **Science China Info. Sciences (2018)**: "Dynamical model of HEV with two planetary gear units and its application to optimization of energy consumption"
  - https://link.springer.com/article/10.1007/s11432-018-9864-8

### SAGE/Hindawi Papers
- **Advances in Mechanical Engineering (2017)**: "Analysis of multi-speed transmission and electrically continuous variable transmission using lever analogy method"
  - Authors: Liao & Chen
  - https://journals.sagepub.com/doi/full/10.1177/1687814017712948

- **Mathematical Problems in Engineering (2021)**: "Dynamic Modeling and Simulation of Double-Planetary Gearbox Based on Bond Graph"
  - https://onlinelibrary.wiley.com/doi/10.1155/2021/3964808

---

## Online Technical Resources

### Interactive/Educational
- Graham Davies' PSD Explanation: http://prius.ecrostech.com/original/Understanding/PowerSplitDevice.htm
- Alex Hart's PSD Page: http://eahart.com/prius/psd/
- Tec-Science Willis Equation: https://www.tec-science.com/mechanical-power-transmission/planetary-gear/transmission-ratios-of-planetary-gears-willis-equation/
- Engineering Cheat Sheet - Planetary Gears: https://engineeringcheatsheet.com/planetary-gear-explained/

### Simulation Tools
- MathWorks Power-Split HEV Reference: https://www.mathworks.com/help/sps/ug/hybrid-electric-vehicle-model.html
- MathWorks HEV Simulink Model: https://www.mathworks.com/matlabcentral/fileexchange/28441-hybrid-electric-vehicle-model-in-simulink

---

## Key Equations Summary

### Willis Equation (Planetary Gear Kinematics)
```
ωs·Zs + ωr·Zr = ωc·(Zs + Zr)
```

### Alternative Form
```
ωr - ωc - b(ωs - ωc) = 0    where b = Zs/Zr
```

### Toyota Prius Gen 2 Parameters
- Sun gear: 30 teeth (connected to MG1)
- Ring gear: 78 teeth (connected to MG2/output)
- Planet gears: 23 teeth each
- Final drive ratio: 3.905:1

### Speed Relationship
```
MG1_rpm = 3.6 × ICE_rpm - 2.6 × MG2_rpm
MG2_rpm = 59.1 × vehicle_speed_mph
```

### Torque Balance
```
τs + τr + τc = 0
τr/τs = Zr/Zs = 78/30 = 2.6
```
- ~72% of engine torque to ring gear (wheels)
- ~28% of engine torque to sun gear (MG1)
