# E-CVT / Power-Split Transmission Simulation References

## Key Papers (with links)

### PhD Thesis
1. **Hybrid e-CVT Power Split Drivelines** - Piero Corbelli, University of Bologna
   - Comprehensive coverage of bond graph modeling, one-mode and two-mode power-split systems
   - Highly recommended as primary reference
   - [PDF (University of Bologna)](http://amsdottorato.unibo.it/3271/1/Corbelli_Piero_e-CVT_hybrid_driveline_applications.pdf)

### Journal Papers
2. **Modeling and Control of a Power-Split Hybrid Vehicle** - Liu & Peng (IEEE 2008)
   - State-space formulation, Dynamic Programming, ECMS control
   - IEEE Transactions on Control Systems Technology, Vol. 16, No. 6
   - [IEEE Xplore](https://ieeexplore.ieee.org/document/4475524/) | [PDF (U-Michigan)](https://huei.engin.umich.edu/wp-content/uploads/sites/186/2015/02/Liu-TCST-split-paper.pdf)

3. **Modeling and Analysis of the Toyota Hybrid System** - Liu, Peng & Filipi (IEEE 2005)
   - THS-specific modeling, Simulink implementation
   - IEEE/ASME International Conference on Advanced Intelligent Mechatronics
   - [PDF (UVic)](https://www.engr.uvic.ca/~mech459/Pub_References/01500979.pdf) | [ResearchGate](https://www.researchgate.net/publication/265033863_Modeling_and_Analysis_of_the_Toyota_Hybrid_System)

4. **Powertrain configuration design for two mode power split hybrid electric vehicle** - Ke et al. (2025)
   - Two-mode power-split design methodology
   - Nature Scientific Reports 15, 3676
   - [Nature (Open Access)](https://www.nature.com/articles/s41598-025-87378-w)

### Conference Papers
5. **Design of Power-Split Hybrid Vehicles with a Single Planetary Gear** - Li, Zhang & Peng (ASME 2012)
   - Design space exploration, lever analogy
   - ASME Dynamic Systems and Control Conference
   - [PDF (U-Michigan)](https://huei.engin.umich.edu/wp-content/uploads/sites/186/2015/02/DSCC-2012-Zhang.pdf) | [ASME](https://asmedigitalcollection.asme.org/DSCC/proceedings-abstract/DSCC2012-MOVIC2012/45301/857/229180)

6. **Optimal Design of Three-Planetary-Gear Power-Split Hybrid Powertrains** - Zhuang et al.
   - Multi-planetary gear optimization
   - arXiv:1708.00151 / Int. J. Automotive Technology
   - [arXiv](https://arxiv.org/abs/1708.00151) | [PDF](https://arxiv.org/pdf/1708.00151)

---

## Textbooks (Library/Purchase)

### Primary Textbook
- **"Modern Electric, Hybrid Electric, and Fuel Cell Vehicles: Fundamentals, Theory, and Design"**
  - Authors: Mehrdad Ehsani, Yimin Gao, Stefano Longo, Kambiz Ebrahimi
  - Publisher: CRC Press, 3rd Edition (2018)
  - ISBN: 978-1498761772
  - [Routledge](https://www.routledge.com/Modern-Electric-Hybrid-Electric-and-Fuel-Cell-Vehicles/Ehsani-Gao-Longo-Ebrahimi/p/book/9781498761772)

### Secondary Textbook
- **"Electric Vehicle Technology Explained"**
  - Authors: James Larminie, John Lowry
  - Publisher: Wiley, 2nd Edition (2012)
  - ISBN: 978-1119942733
  - [Wiley Online Library](https://onlinelibrary.wiley.com/doi/book/10.1002/9781118361146)

---

## Additional Papers (via University Library)

### SAE Technical Papers
- **SAE 2008-01-1313**: "Control-Oriented Modeling of Power Split Devices in Combined Hybrid-Electric Vehicles"
  - [SAE MOBILUS](https://saemobilus.sae.org/content/2008-01-1313/)

- **SAE 810102**: "The Lever Analogy: A New Tool in Transmission Analysis" (1981)
  - Authors: Benford & Leising - Classic foundational paper

### IEEE Papers
- **IEEE Trans. Vehicular Tech. (2016)**: "Design of Multimode Power-Split Hybrid Vehicles"
  - Authors: Zhang, Li, Peng, Sun
  - Vol. 65, No. 6, pp. 4790-4801

### Springer Papers
- [Dynamic modeling of the THS series/parallel power train](https://link.springer.com/article/10.1007/s12239-012-0013-8) - Int. J. Automotive Technology (2012)
- [Dynamical model of HEV with two planetary gear units](https://link.springer.com/article/10.1007/s11432-018-9864-8) - Science China Info. Sciences (2018)

### SAGE/Hindawi Papers
- [Multi-speed transmission analysis using lever analogy](https://journals.sagepub.com/doi/full/10.1177/1687814017712948) - Advances in Mechanical Engineering (2017)
- [Double-Planetary Gearbox Bond Graph Model](https://onlinelibrary.wiley.com/doi/10.1155/2021/3964808) - Mathematical Problems in Engineering (2021)

---

## Online Technical Resources

### Interactive/Educational
- [Graham Davies' PSD Explanation](http://prius.ecrostech.com/original/Understanding/PowerSplitDevice.htm)
- [Alex Hart's PSD Page](http://eahart.com/prius/psd/)
- [Tec-Science Willis Equation](https://www.tec-science.com/mechanical-power-transmission/planetary-gear/transmission-ratios-of-planetary-gears-willis-equation/)
- [Engineering Cheat Sheet - Planetary Gears](https://engineeringcheatsheet.com/planetary-gear-explained/)

### Simulation Tools
- [MathWorks Power-Split HEV Reference](https://www.mathworks.com/help/sps/ug/hybrid-electric-vehicle-model.html)
- [MathWorks HEV Simulink Model](https://www.mathworks.com/matlabcentral/fileexchange/28441-hybrid-electric-vehicle-model-in-simulink)

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
